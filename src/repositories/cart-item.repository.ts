import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from 'src/entities/cart-item.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CartItemRepository {
  constructor(
    @InjectRepository(CartItem)
    private readonly repository: Repository<CartItem>,
  ) {}

  async findById(id: string): Promise<CartItem | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'cart',
        'cart.customer',
        'menuItem',
        'menuItem.category',
        'menuItem.images',
      ],
    });
  }

  async findByCartIdAndMenuItemId(
    cartId: string,
    menuItemId: number,
  ): Promise<CartItem | null> {
    return this.repository.findOne({
      where: {
        cart: {
          id: cartId,
        },
        menuItem: {
          id: menuItemId,
        },
      },
      relations: [
        'cart',
        'menuItem',
        'menuItem.category',
        'menuItem.images',
      ],
    });
  }

  async save(cartItem: CartItem): Promise<CartItem> {
    return this.repository.save(cartItem);
  }

  async remove(cartItem: CartItem): Promise<CartItem> {
    return this.repository.remove(cartItem);
  }
}