import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entities/order.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
  ) {}

  async save(order: Order, manager?: EntityManager): Promise<Order> {
    const repo = manager
      ? manager.getRepository(Order)
      : this.repository;

    return repo.save(order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['customer', 'items'],
    });
  }

  async findByIdAndCustomerId(
    id: string,
    customerId: string,
  ): Promise<Order | null> {
    return this.repository.findOne({
      where: { id, customerId },
      relations: ['customer', 'items'],
    });
  }

  async findByIdAndCustomerIdForUpdate(
    id: string,
    customerId: string,
    manager: EntityManager,
  ): Promise<Order | null> {
    return manager.getRepository(Order).findOne({
      where: { id, customerId },
      relations: ['items'],
      lock: { mode: 'pessimistic_write' },
    });
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.repository.find({
      where: { customerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    data: Partial<Order>,
    manager: EntityManager,
  ): Promise<Order> {
    const repo = manager.getRepository(Order);
    const order = repo.create(data);
    return repo.save(order);
  }
}