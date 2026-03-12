import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddToCartDto } from 'src/dto/cart/add-to-cart.dto';
import { UpdateCartItemDto } from 'src/dto/cart/update-cart-item.dto';
import { Cart } from 'src/entities/cart.entity';
import { CartItem } from 'src/entities/cart-item.entity';
import { MenuItemRepository } from 'src/repositories/menu-item.repository';
import { CustomerRepository } from 'src/repositories/customer.repository';
import { CartRepository } from 'src/repositories/cart.repository';
import { CartItemRepository } from 'src/repositories/cart-item.repository';

@Injectable()
export class CartService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly menuItemRepository: MenuItemRepository,
  ) {}

  // ─── ADD TO CART ────────────────────────────────────────────
  async addToCart(userId: string, dto: AddToCartDto) {
    const customer = await this.getCustomerOrFail(userId);

    const menuItem = await this.menuItemRepository.findById(dto.menuItemId);
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }
    if (!menuItem.isAvailable) {
      throw new BadRequestException('Menu item is not available');
    }

    const cart = await this.cartRepository.findOrCreateActiveCart(
      customer.userId,
    );

    try {
      await this.cartRepository.withActiveCartLocked(
        customer.userId,
        async (_lockedCart, manager) => {
          await this.cartItemRepository.addOrUpdateItem(
            _lockedCart.id,
            dto.menuItemId,
            dto.quantity,
            manager,
          );
        },
      );
    } catch (error: any) {
      if (error.message === 'ACTIVE_CART_NOT_FOUND') {
        throw new BadRequestException(
          'Your cart was just checked out. Please try again.',
        );
      }
      throw error;
    }

    // Re-fetch đầy đủ relations cho response
    const updatedCart = await this.cartRepository.findActiveCartByCustomerId(
      customer.userId,
    );

    return this.mapCartResponse(updatedCart!);
  }

  // ─── GET MY CART ────────────────────────────────────────────
  async getMyCart(userId: string) {
    const customer = await this.getCustomerOrFail(userId);

    const cart = await this.cartRepository.findOrCreateActiveCart(
      customer.userId,
    );

    return this.mapCartResponse(cart);
  }

  // ─── UPDATE CART ITEM ───────────────────────────────────────
  async updateCartItem(
    userId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ) {
    const customer = await this.getCustomerOrFail(userId);

    await this.cartRepository.withActiveCartLocked(
      customer.userId,
      async (lockedCart, manager) => {
        const cartItem = lockedCart.items.find(
          (item) => item.id === cartItemId,
        );

        if (!cartItem) {
          throw new NotFoundException('Cart item not found');
        }

        if (!cartItem.menuItem.isAvailable) {
          throw new BadRequestException('Menu item is not available');
        }

        cartItem.quantity = dto.quantity;
        await this.cartItemRepository.save(cartItem, manager);
      },
    );

    const updatedCart = await this.cartRepository.findActiveCartByCustomerId(
      customer.userId,
    );

    return this.mapCartResponse(updatedCart!);
  }

  // ─── REMOVE CART ITEM ──────────────────────────────────────
  async removeCartItem(userId: string, cartItemId: string) {
    const customer = await this.getCustomerOrFail(userId);

    await this.cartRepository.withActiveCartLocked(
      customer.userId,
      async (lockedCart, manager) => {
        const cartItem = lockedCart.items.find(
          (item) => item.id === cartItemId,
        );

        if (!cartItem) {
          throw new NotFoundException('Cart item not found');
        }

        await this.cartItemRepository.remove(cartItem, manager);
      },
    );

    const updatedCart = await this.cartRepository.findActiveCartByCustomerId(
      customer.userId,
    );

    return this.mapCartResponse(updatedCart!);
  }

  // ─── HELPERS ────────────────────────────────────────────────
  private async getCustomerOrFail(userId: string) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  private mapCartResponse(cart: Cart) {
    const items = (cart.items || []).map((item) => {
      const firstImage = item.menuItem.images?.[0];

      return {
        cartItemId: item.id,
        quantity: item.quantity,
        menuItem: {
          id: item.menuItem.id,
          name: item.menuItem.name,
          description: item.menuItem.description ?? null,
          price: Number(item.menuItem.price),
          imageUrl: firstImage ? firstImage.imageUrl : null,
          category: item.menuItem.category?.name ?? null,
          available: item.menuItem.isAvailable,
        },
        lineTotal: Number(item.menuItem.price) * item.quantity,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
      id: cart.id,
      customerId: cart.customer.userId,
      status: cart.status,
      items,
      totalAmount,
    };
  }
}