import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from 'src/entities/cart.entity';
import { CartStatus } from 'src/enums/cart-status.enum';
import { Repository } from 'typeorm';

@Injectable()
export class CartRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly repository: Repository<Cart>,
  ) {}

  async findActiveCartByCustomerId(customerId: string): Promise<Cart | null> {
    return this.repository.findOne({
      where: {
        customerId,
        status: CartStatus.ACTIVE,
      },
      relations: ['customer', 'items', 'items.menuItem', 'items.menuItem.category', 'items.menuItem.images'],
    });
  }

  async createActiveCartForCustomer(customerId: string): Promise<Cart> {
    const cart = this.repository.create({
      customerId,
      status: CartStatus.ACTIVE,
    });

    return this.repository.save(cart);
  }

  async save(cart: Cart): Promise<Cart> {
    return this.repository.save(cart);
  }
}