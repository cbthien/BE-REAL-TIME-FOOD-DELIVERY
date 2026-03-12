import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { CreateOrderDto } from 'src/dto/order/create-order.dto';
import { OrderItem } from 'src/entities/order-item.entity';
import { Order } from 'src/entities/order.entity';
import { Cart } from 'src/entities/cart.entity';

import { CartStatus } from 'src/enums/cart-status.enum';
import { OrderStatus } from 'src/enums/order-status.enum';
import { PaymentMethod } from 'src/enums/payment-method.enum';
import { PaymentStatus } from 'src/enums/payment-status.enum';
import { WalletTransactionType } from 'src/enums/wallet-transaction-type.enum';

import { CartRepository } from 'src/repositories/cart.repository';
import { CustomerRepository } from 'src/repositories/customer.repository';
import { OrderRepository } from 'src/repositories/order.repository';
import { OrderItemRepository } from 'src/repositories/order-item.repository';
import { WalletRepository } from 'src/repositories/wallet.repository';
import { WalletTransactionRepository } from 'src/repositories/wallet-transaction.repository';

/** Trạng thái cho phép customer tự cancel */
const CUSTOMER_CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
];

@Injectable()
export class OrderService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly customerRepository: CustomerRepository,
    private readonly cartRepository: CartRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly walletRepository: WalletRepository,
    private readonly walletTransactionRepository: WalletTransactionRepository,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const customer = await this.getCustomerOrFail(userId, manager);
      const cart = await this.getActiveCartOrFail(customer.userId, manager);

      this.validateCart(cart);

      const totalAmount = this.calculateCartTotal(cart);

      const order = await this.orderRepository.create(
        {
          customerId: customer.userId,
          customer,
          status: OrderStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.UNPAID,
          totalAmount,
        },
        manager,
      );

      const orderItems = this.buildOrderItemsFromCart(cart, order);
      order.items = await this.orderItemRepository.saveMany(
        orderItems,
        manager,
      );

      if (dto.paymentMethod === PaymentMethod.WALLET) {
        await this.payWithWallet(customer.userId, order, totalAmount, manager);
      }

      cart.status = CartStatus.CHECKED_OUT;
      await this.cartRepository.save(cart, manager);

      return this.mapOrderResponse(order);
    });
  }

  async getMyOrders(userId: string) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const orders = await this.orderRepository.findByCustomerId(
      customer.userId,
    );
    return orders.map((order) => this.mapOrderResponse(order));
  }

  async getMyOrderDetail(userId: string, orderId: string) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const order = await this.orderRepository.findByIdAndCustomerId(
      orderId,
      customer.userId,
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.mapOrderResponse(order);
  }

  async cancelMyOrder(userId: string, orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      const customer = await this.getCustomerOrFail(userId, manager);

      const order = await this.orderRepository.findByIdAndCustomerIdForUpdate(
        orderId,
        customer.userId,
        manager,
      );

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // ── Idempotent: đã cancel rồi thì trả luôn ──
      if (order.status === OrderStatus.CANCELLED) {
        return this.mapOrderResponse(order);
      }

      // ── Chỉ cho cancel khi PENDING hoặc CONFIRMED ──
      if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
        throw new BadRequestException(
          `Order cannot be cancelled at status "${order.status}". ` +
            `Allowed: ${CUSTOMER_CANCELLABLE_STATUSES.join(', ')}`,
        );
      }

      // ── Cancel logic theo payment method ──
      if (
        order.paymentMethod === PaymentMethod.WALLET &&
        order.paymentStatus === PaymentStatus.PAID
      ) {
        await this.refundToWallet(customer.userId, order, manager);
        // refundToWallet đã set status + paymentStatus + save
      } else {
        // CASH (UNPAID) hoặc WALLET nhưng chưa PAID (edge case)
        order.status = OrderStatus.CANCELLED;
        // Giữ nguyên paymentStatus hiện tại — không ghi đè
        await this.orderRepository.save(order, manager);
      }

      return this.mapOrderResponse(order);
    });
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────

  private async getCustomerOrFail(userId: string, manager: EntityManager) {
    const customer = await this.customerRepository.findByUserId(
      userId,
      manager,
    );

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  private async getActiveCartOrFail(
    customerId: string,
    manager: EntityManager,
  ) {
    const cart = await this.cartRepository.findActiveCartByCustomerIdForUpdate(
      customerId,
      manager,
    );

    if (!cart) {
      throw new BadRequestException('Active cart not found');
    }

    return cart;
  }

  private validateCart(cart: Cart) {
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const cartItem of cart.items) {
      if (!cartItem.menuItem) {
        throw new BadRequestException('Cart contains invalid menu item');
      }

      if (!cartItem.menuItem.isActive || !cartItem.menuItem.isAvailable) {
        throw new BadRequestException(
          `Menu item "${cartItem.menuItem.name}" is not available`,
        );
      }
    }
  }

  private calculateCartTotal(cart: Cart): number {
    let total = 0;
    for (const cartItem of cart.items) {
      total += cartItem.menuItem.price * cartItem.quantity;
    }
    return total;
  }

  private buildOrderItemsFromCart(cart: Cart, order: Order): OrderItem[] {
    return cart.items.map((cartItem) => {
      const firstImage = cartItem.menuItem.images?.[0];

      const orderItem = new OrderItem();
      orderItem.orderId = order.id;
      orderItem.order = order;
      orderItem.menuItemId = cartItem.menuItem.id;
      orderItem.menuItemName = cartItem.menuItem.name;
      orderItem.menuItemDescription = cartItem.menuItem.description ?? null;
      orderItem.menuItemImageUrl = firstImage ? firstImage.imageUrl : null;
      orderItem.menuItemCategoryName =
        cartItem.menuItem.category?.name ?? null;
      orderItem.quantity = cartItem.quantity;
      orderItem.price = cartItem.menuItem.price;

      return orderItem;
    });
  }

  private async payWithWallet(
    customerId: string,
    order: Order,
    totalAmount: number,
    manager: EntityManager,
  ) {
    const wallet = await this.getWalletOrFail(customerId, manager);

    if (wallet.balance < totalAmount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = wallet.balance - totalAmount;

    wallet.balance = balanceAfter;
    await this.walletRepository.save(wallet, manager);

    await this.walletTransactionRepository.createWithManager(
      {
        walletId: wallet.id,
        type: WalletTransactionType.PAYMENT,
        amount: totalAmount,
        balanceBefore,
        balanceAfter,
        referenceType: 'ORDER',
        referenceId: order.id,
        description: `Thanh toan don hang #${order.id}`,
      },
      manager,
    );

    order.paymentStatus = PaymentStatus.PAID;
    await this.orderRepository.save(order, manager);
  }

  private async refundToWallet(
    customerId: string,
    order: Order,
    manager: EntityManager,
  ) {
    const wallet = await this.getWalletOrFail(customerId, manager);

    const balanceBefore = wallet.balance;
    const refundAmount = order.totalAmount;
    const balanceAfter = balanceBefore + refundAmount;

    wallet.balance = balanceAfter;
    await this.walletRepository.save(wallet, manager);

    await this.walletTransactionRepository.createWithManager(
      {
        walletId: wallet.id,
        type: WalletTransactionType.REFUND,
        amount: refundAmount,
        balanceBefore,
        balanceAfter,
        referenceType: 'ORDER',
        referenceId: order.id,
        description: `Hoan tien don hang #${order.id}`,
      },
      manager,
    );

    order.status = OrderStatus.CANCELLED;
    order.paymentStatus = PaymentStatus.REFUNDED;
    await this.orderRepository.save(order, manager);
  }

  private async getWalletOrFail(customerId: string, manager: EntityManager) {
    const wallet = await this.walletRepository.findByCustomerIdForUpdate(
      customerId,
      manager,
    );

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    return wallet;
  }

  private mapOrderResponse(order: Order) {
    const items = (order.items || []).map((item) => ({
      orderItemId: item.id,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.price * item.quantity,
      menuItem: {
        id: item.menuItemId,
        name: item.menuItemName,
        description: item.menuItemDescription,
        imageUrl: item.menuItemImageUrl,
        category: item.menuItemCategoryName,
      },
    }));

    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      items,
      createdAt: order.createdAt,
    };
  }
}