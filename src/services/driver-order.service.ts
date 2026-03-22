import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UpdateDriverLocationDto } from 'src/dto/driver/update-driver-location.dto';
import { Driver } from 'src/entities/driver.entity';
import { Order } from 'src/entities/order.entity';
import { storeConfig } from 'src/config/store.config';
import { DriverStatus } from 'src/enums/driver-status.enum';
import { OrderStatus } from 'src/enums/order-status.enum';
import { TrackingGateway } from 'src/gateways/tracking.gateway';
import { DriverRepository } from 'src/repositories/driver.repository';
import { OrderRepository } from 'src/repositories/order.repository';
import { PaymentMethod } from 'src/enums/payment-method.enum';
import { PaymentStatus } from 'src/enums/payment-status.enum';

@Injectable()
export class DriverOrderService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly driverRepository: DriverRepository,
    private readonly orderRepository: OrderRepository,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async getMyOrders(userId: string) {
    const driver = await this.driverRepository.findByUserId(userId);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const orders = await this.orderRepository.findByDriverId(driver.userId);
    return orders.map((order) => this.mapOrderResponse(order));
  }

  async getMyOrderDetail(userId: string, orderId: string) {
    const driver = await this.driverRepository.findByUserId(userId);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const order = await this.orderRepository.findByIdAndDriverId(
      orderId,
      driver.userId,
    );

    if (!order) {
      throw new NotFoundException(
        'Order not found or not assigned to this driver',
      );
    }

    return this.mapOrderResponse(order);
  }

  async confirmPickUp(userId: string, orderId: string) {
    const hydratedOrder = await this.dataSource.transaction(async (manager) => {
      const driver = await this.driverRepository.findByUserId(userId, manager);

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      const order = await this.orderRepository.findByIdAndDriverIdForUpdate(
        orderId,
        driver.userId,
        manager,
      );

      if (!order) {
        throw new NotFoundException(
          'Order not found or not assigned to this driver',
        );
      }

      if (order.status !== OrderStatus.READY) {
        throw new BadRequestException('Only READY orders can be picked up');
      }

      order.status = OrderStatus.PICKED_UP;
      order.pickedUpAt = new Date();
      order.driverConfirmedDelivered = false;
      order.customerConfirmedDelivered = false;

      await this.orderRepository.save(order, manager);

      const saved = await this.orderRepository.findById(order.id, manager);

      if (!saved) {
        throw new NotFoundException('Order not found after pickup');
      }

      return saved;
    });

    this.emitTrackingStatus(hydratedOrder);

    return this.mapOrderResponse(hydratedOrder);
  }

  async updateCurrentLocation(
    userId: string,
    orderId: string,
    dto: UpdateDriverLocationDto,
  ) {
    const payload = await this.dataSource.transaction(async (manager) => {
      const driver = await this.driverRepository.findByUserIdForUpdate(
        userId,
        manager,
      );

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      if (!driver.user) {
        throw new NotFoundException('Driver user not found');
      }

      if (!driver.user.isActive) {
        throw new BadRequestException('Driver account is inactive');
      }

      if (driver.status !== DriverStatus.ACTIVE) {
        throw new BadRequestException('Driver is suspended');
      }

      if (!driver.isOnline) {
        throw new BadRequestException(
          'Driver must be online to update current location',
        );
      }

      const order = await this.orderRepository.findByIdAndDriverIdForUpdate(
        orderId,
        driver.userId,
        manager,
      );

      if (!order) {
        throw new NotFoundException(
          'Order not found or not assigned to this driver',
        );
      }

      if (order.status !== OrderStatus.PICKED_UP) {
        throw new BadRequestException(
          'Driver location can only be updated when order is PICKED_UP',
        );
      }

      driver.currentLat = dto.currentLat;
      driver.currentLng = dto.currentLng;
      driver.lastLocationAt = new Date();

      const updatedDriver = await this.driverRepository.save(driver, manager);

      return this.mapDriverLocationResponse(order, updatedDriver);
    });

    try {
      this.trackingGateway.emitOrderLocationUpdated(orderId, payload);
    } catch {
      void 0;
    }

    return payload;
  }

  async confirmDelivered(userId: string, orderId: string) {
    const hydratedOrder = await this.dataSource.transaction(async (manager) => {
      const driver = await this.driverRepository.findByUserId(userId, manager);

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      const order = await this.orderRepository.findByIdAndDriverIdForUpdate(
        orderId,
        driver.userId,
        manager,
      );

      if (!order) {
        throw new NotFoundException(
          'Order not found or not assigned to this driver',
        );
      }

      if (order.status !== OrderStatus.PICKED_UP) {
        throw new BadRequestException(
          'Only PICKED_UP orders can be confirmed as delivered',
        );
      }

      if (!order.driverConfirmedDelivered) {
        order.driverConfirmedDelivered = true;

        if (order.customerConfirmedDelivered) {
          order.status = OrderStatus.DELIVERED;
          order.deliveredAt = new Date();

          if (
            order.paymentMethod === PaymentMethod.CASH &&
            order.paymentStatus === PaymentStatus.UNPAID
          ) {
            order.paymentStatus = PaymentStatus.PAID;
          }
        }

        await this.orderRepository.save(order, manager);
      }

      const saved = await this.orderRepository.findById(order.id, manager);

      if (!saved) {
        throw new NotFoundException(
          'Order not found after delivery confirmation',
        );
      }

      return saved;
    });

    this.emitTrackingStatus(hydratedOrder);

    return this.mapOrderResponse(hydratedOrder);
  }

  private emitTrackingStatus(order: Order) {
    try {
      this.trackingGateway.emitOrderStatusUpdated(
        String(order.id),
        this.mapTrackingSnapshot(order),
      );
    } catch {
      void 0;
    }
  }

  private mapTrackingSnapshot(order: Order) {
    return {
      orderId: String(order.id),
      status: order.status,
      driver: order.driver
        ? {
            userId: order.driver.userId,
            fullName: order.driver.user?.fullName ?? null,
            email: order.driver.user?.email ?? null,
            phone: order.driver.user?.phone ?? null,
            isOnline: order.driver.isOnline,
            status: order.driver.status,
            vehicleType: order.driver.vehicleType ?? null,
            licensePlate: order.driver.licensePlate ?? null,
            currentLocation: {
              lat: order.driver.currentLat ?? null,
              lng: order.driver.currentLng ?? null,
              lastLocationAt: order.driver.lastLocationAt ?? null,
            },
          }
        : null,
      delivery: {
        addressText: order.deliveryAddressText ?? null,
        lat: order.deliveryLat ?? null,
        lng: order.deliveryLng ?? null,
      },
      store: {
        name: storeConfig.name,
        address: storeConfig.address,
        lat: storeConfig.lat,
        lng: storeConfig.lng,
      },
      assignedAt: order.assignedAt,
      pickedUpAt: order.pickedUpAt,
      deliveredAt: order.deliveredAt,
      driverConfirmedDelivered: order.driverConfirmedDelivered,
      customerConfirmedDelivered: order.customerConfirmedDelivered,
    };
  }

  private mapDriverLocationResponse(order: Order, driver: Driver) {
    return {
      orderId: String(order.id),
      status: order.status,
      driverId: String(driver.userId),
      currentLat: driver.currentLat,
      currentLng: driver.currentLng,
      lastLocationAt: driver.lastLocationAt
        ? new Date(driver.lastLocationAt).toISOString()
        : null,
    };
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
      customer: order.customer
        ? {
            userId: order.customer.userId,
            fullName: order.customer.user?.fullName ?? null,
            email: order.customer.user?.email ?? null,
            phone: order.customer.user?.phone ?? null,
          }
        : null,
      driverId: order.driverId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      pickupAddress: storeConfig.address,
      store: {
        name: storeConfig.name,
        address: storeConfig.address,
        lat: storeConfig.lat,
        lng: storeConfig.lng,
      },
      delivery: {
        addressText: order.deliveryAddressText ?? null,
        lat: order.deliveryLat ?? null,
        lng: order.deliveryLng ?? null,
      },
      driverLocation:
        order.driver &&
        order.driver.currentLat != null &&
        order.driver.currentLng != null
          ? {
              lat: order.driver.currentLat,
              lng: order.driver.currentLng,
              timestamp: order.driver.lastLocationAt
                ? order.driver.lastLocationAt.toISOString()
                : null,
            }
          : null,
      assignedAt: order.assignedAt,
      pickedUpAt: order.pickedUpAt,
      deliveredAt: order.deliveredAt,
      driverConfirmedDelivered: order.driverConfirmedDelivered,
      customerConfirmedDelivered: order.customerConfirmedDelivered,
      deliveryCompletion: {
        driverConfirmed: order.driverConfirmedDelivered,
        customerConfirmed: order.customerConfirmedDelivered,
        completed: order.status === OrderStatus.DELIVERED,
      },
      items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
