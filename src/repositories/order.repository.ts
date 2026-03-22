import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entities/order.entity';
import { OrderStatus } from 'src/enums/order-status.enum';
import { EntityManager, In, Repository } from 'typeorm';

const DRIVER_BUSY_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.READY,
  OrderStatus.PICKED_UP,
];

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
  ) {}

  async save(order: Order, manager?: EntityManager): Promise<Order> {
    const repo = manager ? manager.getRepository(Order) : this.repository;
    return repo.save(order);
  }

  async findById(id: string, manager?: EntityManager): Promise<Order | null> {
    const repo = manager ? manager.getRepository(Order) : this.repository;

    return repo.findOne({
      where: { id },
      relations: [
        'customer',
        'customer.user',
        'driver',
        'driver.user',
        'items',
      ],
    });
  }

  async findByIdForUpdate(
    id: string,
    manager: EntityManager,
  ): Promise<Order | null> {
    return manager.getRepository(Order).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async findAll(status?: OrderStatus): Promise<Order[]> {
    return this.repository.find({
      where: status ? { status } : {},
      relations: [
        'customer',
        'customer.user',
        'driver',
        'driver.user',
        'items',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdAndCustomerId(
    id: string,
    customerId: string,
    manager?: EntityManager,
  ): Promise<Order | null> {
    const repo = manager ? manager.getRepository(Order) : this.repository;

    return repo.findOne({
      where: { id, customerId },
      relations: [
        'customer',
        'customer.user',
        'driver',
        'driver.user',
        'items',
      ],
    });
  }

  async findByIdAndCustomerIdForUpdate(
    id: string,
    customerId: string,
    manager: EntityManager,
  ): Promise<Order | null> {
    return manager.getRepository(Order).findOne({
      where: { id, customerId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async findByCustomerId(
    customerId: string,
    manager?: EntityManager,
  ): Promise<Order[]> {
    const repo = manager ? manager.getRepository(Order) : this.repository;

    return repo.find({
      where: { customerId },
      relations: [
        'customer',
        'customer.user',
        'driver',
        'driver.user',
        'items',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDriverId(
    driverId: string,
    manager?: EntityManager,
  ): Promise<Order[]> {
    const repo = manager ? manager.getRepository(Order) : this.repository;

    return repo.find({
      where: { driverId },
      relations: [
        'customer',
        'customer.user',
        'driver',
        'driver.user',
        'items',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdAndDriverId(
    id: string,
    driverId: string,
    manager?: EntityManager,
  ): Promise<Order | null> {
    const repo = manager ? manager.getRepository(Order) : this.repository;

    return repo.findOne({
      where: { id, driverId },
      relations: [
        'customer',
        'customer.user',
        'driver',
        'driver.user',
        'items',
      ],
    });
  }

  async findByIdAndDriverIdForUpdate(
    id: string,
    driverId: string,
    manager: EntityManager,
  ): Promise<Order | null> {
    return manager.getRepository(Order).findOne({
      where: { id, driverId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async existsActiveOrderByDriverId(
    driverId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = manager ? manager.getRepository(Order) : this.repository;

    const count = await repo.count({
      where: {
        driverId,
        status: In(DRIVER_BUSY_ORDER_STATUSES),
      },
    });

    return count > 0;
  }

  async findBusyDriverIds(
    driverIds: string[],
    manager?: EntityManager,
  ): Promise<string[]> {
    if (driverIds.length === 0) {
      return [];
    }

    const repo = manager ? manager.getRepository(Order) : this.repository;

    const rows = await repo
      .createQueryBuilder('order')
      .select('order.driverId', 'driverId')
      .where('order.driverId IN (:...driverIds)', { driverIds })
      .andWhere('order.status IN (:...busyStatuses)', {
        busyStatuses: DRIVER_BUSY_ORDER_STATUSES,
      })
      .groupBy('order.driverId')
      .getRawMany<{ driverId: string | null }>();

    return rows
      .map((row) => row.driverId)
      .filter((driverId): driverId is string => Boolean(driverId));
  }

  async create(data: Partial<Order>, manager: EntityManager): Promise<Order> {
    const repo = manager.getRepository(Order);
    const order = repo.create(data);
    return repo.save(order);
  }
}
