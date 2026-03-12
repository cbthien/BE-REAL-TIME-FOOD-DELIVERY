import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from 'src/entities/cart.entity';
import { CartStatus } from 'src/enums/cart-status.enum';
import { DataSource, EntityManager, Repository } from 'typeorm';

@Injectable()
export class CartRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly repository: Repository<Cart>,
    private readonly dataSource: DataSource,
  ) {}

  async findActiveCartByCustomerId(customerId: string): Promise<Cart | null> {
    return this.repository.findOne({
      where: {
        customerId,
        status: CartStatus.ACTIVE,
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

  async findActiveCartByCustomerIdForUpdate(
    customerId: string,
    manager: EntityManager,
  ): Promise<Cart | null> {
    return manager.getRepository(Cart).findOne({
      where: {
        customerId,
        status: CartStatus.ACTIVE,
      },
      relations: [
        'customer',
        'items',
        'items.menuItem',
        'items.menuItem.category',
        'items.menuItem.images',
      ],
      lock: {
        mode: 'pessimistic_write',
      },
    });
  }

  async findOrCreateActiveCart(customerId: string): Promise<Cart> {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager
        .getRepository(Cart)
        .createQueryBuilder('cart')
        .setLock('pessimistic_write')
        .where('cart.customer_id = :customerId', { customerId })
        .andWhere('cart.status = :status', { status: CartStatus.ACTIVE })
        .getOne();

      if (existing) {
        return manager.getRepository(Cart).findOneOrFail({
          where: { id: existing.id },
          relations: [
            'customer',
            'items',
            'items.menuItem',
            'items.menuItem.category',
            'items.menuItem.images',
          ],
        });
      }

      try {
        const cart = manager.getRepository(Cart).create({
          customerId,
          status: CartStatus.ACTIVE,
        });
        const saved = await manager.getRepository(Cart).save(cart);

        return manager.getRepository(Cart).findOneOrFail({
          where: { id: saved.id },
          relations: [
            'customer',
            'items',
            'items.menuItem',
            'items.menuItem.category',
            'items.menuItem.images',
          ],
        });
      } catch (error: any) {
        if (error?.code === '23505') {
          const fallback = await this.findActiveCartByCustomerId(customerId);
          if (fallback) return fallback;
        }
        throw error;
      }
    });
  }

  async createActiveCartForCustomer(
    customerId: string,
    manager?: EntityManager,
  ): Promise<Cart> {
    const repo = manager ? manager.getRepository(Cart) : this.repository;

    const cart = repo.create({
      customerId,
      status: CartStatus.ACTIVE,
    });

    return repo.save(cart);
  }

  async save(cart: Cart, manager?: EntityManager): Promise<Cart> {
    const repo = manager ? manager.getRepository(Cart) : this.repository;
    return repo.save(cart);
  }

  async withActiveCartLocked<T>(
    customerId: string,
    callback: (cart: Cart, manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await this.findActiveCartByCustomerIdForUpdate(
        customerId,
        manager,
      );

      if (!cart) {
        throw new Error('ACTIVE_CART_NOT_FOUND');
      }

      return callback(cart, manager);
    });
  }
}