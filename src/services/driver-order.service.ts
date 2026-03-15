import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DriverRepository } from 'src/repositories/driver.repository';
import { OrderRepository } from 'src/repositories/order.repository';
import { Order } from 'src/entities/order.entity';
import { OrderStatus } from 'src/enums/order-status.enum';

@Injectable()
export class DriverOrderService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly driverRepository: DriverRepository,
    private readonly orderRepository: OrderRepository,
  ) {}

  async getMyOrders(userId: string) {
    const driver = await this.driverRepository.findByUserId(userId);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const orders = await this.orderRepository.findByDriverId(driver.userId);
    return orders.map((order) => this.mapOrderResponse(order));
  }

  async getMyOrderDetail(userId: string, orderId: string) {
    const driver = await this.driverRepository.findByUserId(userId);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const order = await this.orderRepository.findByIdAndDriverId(
      orderId,
      driver.userId,
    );

    if (!order) {
      throw new NotFoundException('Order not found or not assigned to this driver');
    }

    return this.mapOrderResponse(order);
  }

  async confirmPickUp(userId: string, orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      const driver = await this.driverRepository.findByUserId(userId, manager);

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      const order = await this.orderRepository.findByIdAndDriverIdForUpdate(
        orderId,
        driver.userId,
        manager,
      );

      if (!order) {
        throw new NotFoundException('Order not found or not assigned to this driver');
      }

      if (order.status !== OrderStatus.READY) {
        throw new BadRequestException('Only READY orders can be picked up');
      }

      order.status = OrderStatus.PICKED_UP;
      order.pickedUpAt = new Date();
      order.driverConfirmedDelivered = false;
      order.customerConfirmedDelivered = false;

      await this.orderRepository.save(order, manager);
      return this.mapOrderResponse(order);
    });
  }

  async confirmDelivered(userId: string, orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      const driver = await this.driverRepository.findByUserId(userId, manager);

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      const order = await this.orderRepository.findByIdAndDriverIdForUpdate(
        orderId,
        driver.userId,
        manager,
      );

      if (!order) {
        throw new NotFoundException('Order not found or not assigned to this driver');
      }

      if (order.status !== OrderStatus.PICKED_UP) {
        throw new BadRequestException(
          'Only PICKED_UP orders can be confirmed as delivered',
        );
      }

      if (order.driverConfirmedDelivered) {
        return this.mapOrderResponse(order);
      }

      order.driverConfirmedDelivered = true;

      if (order.customerConfirmedDelivered) {
        order.status = OrderStatus.DELIVERED;
        order.deliveredAt = new Date();
      }

      await this.orderRepository.save(order, manager);
      return this.mapOrderResponse(order);
    });
  }

  private mapOrderResponse(order: Order) {
    const items = (order.items || []).map((item) => ({
      orderItemId: item.id,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.price * item.quantity,
      menuItem: {
        id: item.menuItemId,
        name: item.menuItemName,
        description: item.menuItemDescription,
        imageUrl: item.menuItemImageUrl,
        category: item.menuItemCategoryName,
      },
    }));

    return {
      id: order.id,
      customerId: order.customerId,
      customer: order.customer
        ? {
            userId: order.customer.userId,
            fullName: order.customer.user?.fullName ?? null,
            email: order.customer.user?.email ?? null,
            phone: order.customer.user?.phone ?? null,
          }
        : null,
      driverId: order.driverId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      assignedAt: order.assignedAt,
      pickedUpAt: order.pickedUpAt,
      deliveredAt: order.deliveredAt,
      driverConfirmedDelivered: order.driverConfirmedDelivered,
      customerConfirmedDelivered: order.customerConfirmedDelivered,
      items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}