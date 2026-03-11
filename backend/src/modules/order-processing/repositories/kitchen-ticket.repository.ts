import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  KitchenTicket,
  KitchenTicketDocument,
  TicketItem,
} from '../kitchen-ticket.schema';

@Injectable()
export class KitchenTicketRepository {
  constructor(
    @InjectModel(KitchenTicket.name)
    private readonly ticketModel: Model<KitchenTicketDocument>,
  ) {}

  async create(orderId: string, items: TicketItem[]): Promise<KitchenTicketDocument> {
    return this.ticketModel.create({
      orderId,
      items,
      status: 'PENDING',
    });
  }

  async findAll(status?: string): Promise<KitchenTicket[]> {
    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    }

    return this.ticketModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<KitchenTicket | null> {
    return this.ticketModel.findById(id).exec();
  }

  async updateById(id: string, update: Record<string, unknown>): Promise<KitchenTicket | null> {
    return this.ticketModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }
  // Sử dung Atomic update để tránh vấn đề concurrency khi có nhiều người cùng cập nhật một ticket
  async updatWithFilter(filter: any, updateData: any): Promise<KitchenTicket | null> {
    return await this.ticketModel.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true },
    ).exec(); // trả về 1 Promise
  }
}
