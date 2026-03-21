import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Driver } from 'src/entities/driver.entity';
import { User } from 'src/entities/user.entity';
import { DriverStatus } from 'src/enums/driver-status.enum';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class DriverRepository {
  constructor(
    @InjectRepository(Driver)
    private readonly repository: Repository<Driver>,
  ) {}

  async findByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<Driver | null> {
    const repo = manager ? manager.getRepository(Driver) : this.repository;

    return repo.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async findByUserIdForUpdate(
    userId: string,
    manager: EntityManager,
  ): Promise<Driver | null> {
    const driver = await manager.getRepository(Driver).findOne({
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!driver) {
      return null;
    }
    const user = await manager.getRepository(User).findOne({
      where: { id: userId },
    });
    if (user) {
      driver.user = user;
    }
    return driver;
  }

  async findAvailableDrivers(manager?: EntityManager): Promise<Driver[]> {
    const repo = manager ? manager.getRepository(Driver) : this.repository;

    return repo.find({
      where: {
        status: DriverStatus.ACTIVE,
        isOnline: true,
        user: {
          isActive: true,
        },
      },
      relations: ['user'],
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async save(driver: Driver, manager?: EntityManager): Promise<Driver> {
    const repo = manager ? manager.getRepository(Driver) : this.repository;
    return repo.save(driver);
  }
}