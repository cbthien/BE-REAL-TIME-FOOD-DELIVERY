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

  async findAvailableDrivers(
    excludeDriverIds: string[] = [],
    manager?: EntityManager,
  ): Promise<Driver[]> {
    const repo = manager ? manager.getRepository(Driver) : this.repository;

    const qb = repo
      .createQueryBuilder('driver')
      .innerJoinAndSelect('driver.user', 'user')
      .where('driver.status = :driverStatus', {
        driverStatus: DriverStatus.ACTIVE,
      })
      .andWhere('driver.isOnline = :isOnline', { isOnline: true })
      .andWhere('user.isActive = :isActive', { isActive: true });

    if (excludeDriverIds.length > 0) {
      qb.andWhere('driver.userId NOT IN (:...excludeDriverIds)', {
        excludeDriverIds,
      });
    }

    return qb.orderBy('driver.updatedAt', 'DESC').getMany();
  }

  async save(driver: Driver, manager?: EntityManager): Promise<Driver> {
    const repo = manager ? manager.getRepository(Driver) : this.repository;
    return repo.save(driver);
  }
}