import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { KitchenTicket } from './kitchen-ticket.schema';
import { KitchenTicketRepository } from './repositories/kitchen-ticket.repository';
import { TicketStateGuard } from './state/ticket-state.guard';

@Injectable()
export class OrderProcessingService {
  constructor(
    private readonly kitchenTicketRepository: KitchenTicketRepository,
    private readonly ticketStateGuard: TicketStateGuard,
    private eventEmitter: EventEmitter2,
  ) {}

  // TODO M2-BE-03: Implement @OnEvent('order.placed') handler
  // Creates PENDING ticket when order is placed
  @OnEvent('order.placed')
  async handleOrderPlaced(payload: {
    orderId: string;
    items: any[];
    deliveryAddress: string;
  }): Promise<void> {
    const ticket = await this.kitchenTicketRepository.create(
      payload.orderId,
      payload.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
      })),
    );

    console.log(`[OrderProcessing] Created ticket ${ticket._id} for order ${payload.orderId}`);
  }

  // TODO M2-BE-02: Implement ticket endpoints logic
  async findAll(status?: string): Promise<KitchenTicket[]> {
    return this.kitchenTicketRepository.findAll(status);
  }

  async findById(id: string): Promise<KitchenTicket | null> {
    return this.kitchenTicketRepository.findById(id);
  }

  //ACCEPT ORDER: Chuyển ticket từ PENDING -> IN_PROGRESS
  async acceptTicket(id: string, staffId: string): Promise<KitchenTicket> {
    // 1. Lấy trạng thái hiện tại của ticket
    const currentTicket = await this.kitchenTicketRepository.findById(id);
    if (!currentTicket) {
      throw new NotFoundException(`Kitchen ticket ${id} not found`);
    }

    // 2. Validate Domain Rule
    this.ticketStateGuard.assertTransition(currentTicket.status, 'IN_PROGRESS');

    // 3. ATOMIC UPDATE: (Optimistic Locking)
    // Update khi mà status đúng là cái vừa check
    const ticket = await this.kitchenTicketRepository.updatWithFilter(
      {
        _id: id,
        status: currentTicket.status, // RACE CONDITION nằm ở đây, 
      },
      {
        status: 'IN_PROGRESS',
        staffId,
        acceptedAt: new Date(),
      }
    );

    // 4. Quăng lỗi nếu có người đã cập nhật đơn rồi
    if (!ticket) {
      throw new ConflictException(`Kitchen ticket ${id} has been updated by another process. Please refresh and try again.`);
    }

    // 5. Emit event for Ordering module
    this.eventEmitter.emit('ticket.confirmed', { orderId: ticket.orderId });

    // TODO: Emit event ra webSocket cho Frontend (staff B, staff C cùng cái ticket) ở đây.

    return ticket;
  }

  // REJECT ORDER: Chuyển ticket từ PENDING -> REJECTED
  async rejectTicket(
    id: string,
    staffId: string,
    reason: string,
  ): Promise<KitchenTicket> {
    // 1. Đọc để lấy trạng thái hiện tại của ticket
    const currentTicket = await this.kitchenTicketRepository.findById(id);
    if (!currentTicket) {
      throw new NotFoundException(`Kitchen ticket ${id} not found`);
    }

    // 2. Validate Domain Rule
    this.ticketStateGuard.assertTransition(currentTicket.status, 'REJECTED');

    // 3. ATOMIC UPDATE: (Optimistic Locking)
    const ticket = await this.kitchenTicketRepository.updatWithFilter(
      {
        _id: id,
        status: currentTicket.status // status phải chưa bị staff khác đổi
      },
      {
        status: 'REJECTED',
        staffId,
        rejectionReason: reason,
      }
    );

    //4. Quăng lỗi nếu có người đã cập nhật đơn rồi
    if (!ticket) {
      throw new ConflictException(`Cannot reject. Kitchen ticket ${id} has been updated by another process. Please refresh and try again.`);
    }
    // Emit event for Ordering module
    this.eventEmitter.emit('ticket.rejected', { orderId: ticket.orderId });

    return ticket;
  }

  async markReady(id: string): Promise<KitchenTicket> {
    const currentTicket = await this.kitchenTicketRepository.findById(id);
    if (!currentTicket) {
      throw new NotFoundException(`Kitchen ticket ${id} not found`);
    }

    this.ticketStateGuard.assertTransition(currentTicket.status, 'READY');

    const ticket = await this.kitchenTicketRepository.updateById(id, {
      status: 'READY',
      readyAt: new Date(),
    });
    if (!ticket) {
      throw new NotFoundException(`Kitchen ticket ${id} not found`);
    }

    // Emit events for Ordering + Delivery modules
    this.eventEmitter.emit('ticket.ready', { orderId: ticket.orderId });

    return ticket;
  }
}
