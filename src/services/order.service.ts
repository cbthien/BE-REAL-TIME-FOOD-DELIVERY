import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from 'src/dto/order/create-order.dto';
import { OrderItem } from 'src/entities/order-item.entity';
import { Order } from 'src/entities/order.entity';
import { CartStatus } from 'src/enums/cart-status.enum';
import { OrderStatus } from 'src/enums/order-status.enum';
import { PaymentMethod } from 'src/enums/payment-method.enum';
import { PaymentStatus } from 'src/enums/payment-status.enum';
import { CartRepository } from 'src/repositories/cart.repository';
import { CustomerRepository } from 'src/repositories/customer.repository';
import { OrderItemRepository } from 'src/repositories/order-item.repository';
import { OrderRepository } from 'src/repositories/order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly cartRepository: CartRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const cart = await this.cartRepository.findActiveCartByCustomerId(
      customer.userId,
    );

    if (!cart) {
      throw new BadRequestException('Active cart not found');
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const cartItem of cart.items) {
      if (!cartItem.menuItem.isActive || !cartItem.menuItem.isAvailable) {
        throw new BadRequestException(
          `Menu item "${cartItem.menuItem.name}" is not available`,
        );
      }
    }

    const order = new Order();
    order.customerId = customer.userId;
    order.customer = customer;
    order.status = OrderStatus.PENDING;
    order.paymentMethod = dto.paymentMethod;
    order.paymentStatus =
      dto.paymentMethod === PaymentMethod.VNPAY
        ? PaymentStatus.PENDING
        : PaymentStatus.UNPAID;
    order.totalAmount = '0';

    const savedOrder = await this.orderRepository.save(order);

    let totalAmount = 0;

    const orderItems: OrderItem[] = cart.items.map((cartItem) => {
      const orderItem = new OrderItem();
      orderItem.orderId = savedOrder.id;
      orderItem.order = savedOrder;
      orderItem.menuItemId = cartItem.menuItem.id;
      orderItem.menuItem = cartItem.menuItem;
      orderItem.quantity = cartItem.quantity;
      orderItem.price = String(cartItem.menuItem.price);

      totalAmount += Number(cartItem.menuItem.price) * cartItem.quantity;

      return orderItem;
    });

    await this.orderItemRepository.saveMany(orderItems);

    savedOrder.totalAmount = totalAmount.toFixed(2);
    await this.orderRepository.save(savedOrder);

    cart.status = CartStatus.CHECKED_OUT;
    await this.cartRepository.save(cart);

    const createdOrder = await this.orderRepository.findById(savedOrder.id);
    return this.mapOrderResponse(createdOrder!);
  }

  async getMyOrders(userId: string) {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const orders = await this.orderRepository.findByCustomerId(customer.userId);

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

  private mapOrderResponse(order: Order) {
    const items = (order.items || []).map((item) => {
      const firstImage = item.menuItem.images?.[0];

      return {
        orderItemId: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        lineTotal: Number(item.price) * item.quantity,
        menuItem: {
          id: item.menuItem.id,
          name: item.menuItem.name,
          description: item.menuItem.description ?? null,
          imageUrl: firstImage ? firstImage.imageUrl : null,
          category: item.menuItem.category?.name ?? null,
        },
      };
    });

    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: Number(order.totalAmount),
      items,
      createdAt: order.createdAt,
    };
  }
}