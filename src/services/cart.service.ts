import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddToCartDto } from 'src/dto/cart/add-to-cart.dto';
import { UpdateCartItemDto } from 'src/dto/cart/update-cart-item.dto';
import { CartItem } from 'src/entities/cart-item.entity';
import { Cart } from 'src/entities/cart.entity';
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

  async addToCart(userId: string, dto: AddToCartDto) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const menuItem = await this.menuItemRepository.findById(dto.menuItemId);
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (!menuItem.isAvailable) {
      throw new BadRequestException('Menu item is not available');
    }

    let cart = await this.cartRepository.findActiveCartByCustomerId(
      customer.userId,
    );

    if (!cart) {
      cart = await this.cartRepository.createActiveCartForCustomer(
        customer.userId,
      );
    }

    const existingCartItem =
      await this.cartItemRepository.findByCartIdAndMenuItemId(
        cart.id,
        dto.menuItemId,
      );

    if (existingCartItem) {
      existingCartItem.quantity += dto.quantity;
      await this.cartItemRepository.save(existingCartItem);
    } else {
      const cartItem = new CartItem();
      cartItem.cart = cart;
      cartItem.menuItem = menuItem;
      cartItem.quantity = dto.quantity;

      await this.cartItemRepository.save(cartItem);
    }

    const updatedCart = await this.cartRepository.findActiveCartByCustomerId(
      customer.userId,
    );

    return this.mapCartResponse(updatedCart!);
  }

  async getMyCart(userId: string) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    let cart = await this.cartRepository.findActiveCartByCustomerId(
      customer.userId,
    );

    if (!cart) {
      cart = await this.cartRepository.createActiveCartForCustomer(
        customer.userId,
      );

      cart = await this.cartRepository.findActiveCartByCustomerId(
        customer.userId,
      );
    }

    return this.mapCartResponse(cart!);
  }

  async updateCartItem(
    userId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const cartItem = await this.cartItemRepository.findById(cartItemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.cart.customer.userId !== customer.userId) {
      throw new BadRequestException(
        'This cart item does not belong to current customer',
      );
    }

    if (!cartItem.menuItem.isAvailable) {
      throw new BadRequestException('Menu item is not available');
    }

    cartItem.quantity = dto.quantity;
    await this.cartItemRepository.save(cartItem);

    const updatedCart = await this.cartRepository.findActiveCartByCustomerId(
      customer.userId,
    );

    return this.mapCartResponse(updatedCart!);
  }

  async removeCartItem(userId: string, cartItemId: string) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const cartItem = await this.cartItemRepository.findById(cartItemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.cart.customer.userId !== customer.userId) {
      throw new BadRequestException(
        'This cart item does not belong to current customer',
      );
    }

    await this.cartItemRepository.remove(cartItem);

    const updatedCart = await this.cartRepository.findActiveCartByCustomerId(
      customer.userId,
    );

    return this.mapCartResponse(updatedCart!);
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