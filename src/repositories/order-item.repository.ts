import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderItem } from 'src/entities/order-item.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderItemRepository {
  constructor(
    @InjectRepository(OrderItem)
    private readonly repository: Repository<OrderItem>,
  ) {}

  async save(orderItem: OrderItem): Promise<OrderItem> {
    return this.repository.save(orderItem);
  }

  async saveMany(orderItems: OrderItem[]): Promise<OrderItem[]> {
    return this.repository.save(orderItems);
  }
}