import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entities/order.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
  ) {}

  async save(order: Order): Promise<Order> {
    return this.repository.save(order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'customer',
        'items',
        'items.menuItem',
        'items.menuItem.category',
        'items.menuItem.images',
      ],
    });
  }

  async findByIdAndCustomerId(
    id: string,
    customerId: string,
  ): Promise<Order | null> {
    return this.repository.findOne({
      where: {
        id,
        customerId,
      },
      relations: [
        'customer',
        'items',
        'items.menuItem',
        'items.menuItem.category',
        'items.menuItem.images',
      ],
    });
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.repository.find({
      where: { customerId },
      relations: [
        'items',
        'items.menuItem',
        'items.menuItem.category',
        'items.menuItem.images',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}