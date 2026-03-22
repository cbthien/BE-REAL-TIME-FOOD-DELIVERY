import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from 'src/entities/user.entity';
import { Staff } from 'src/entities/staff.entity';
import { Driver } from 'src/entities/driver.entity';
import { Order } from 'src/entities/order.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { Customer } from 'src/entities/customer.entity';

import { UserRole } from 'src/enums/user-role.enum';
import { DriverStatus } from 'src/enums/driver-status.enum';
import { OrderStatus } from 'src/enums/order-status.enum';
import { PaymentStatus } from 'src/enums/payment-status.enum';

import { CreateStaffDto } from 'src/dto/admin/create-staff.dto';
import { UpdateStaffDto } from 'src/dto/admin/update-staff.dto';
import { CreateDriverDto } from 'src/dto/admin/create-driver.dto';
import { UpdateDriverDto } from 'src/dto/admin/update-driver.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,

    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async getDashboardStats() {
    const activeOrderStatuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.PICKED_UP,
    ];

    const { startOfToday, endOfToday } = this.getTodayRange();

    const [
      totalOrders,
      activeOrders,
      totalUsers,
      totalCustomers,
      totalStaffs,
      totalDrivers,
      activeDrivers,
      totalRevenueRow,
      todayRevenueRow,
      deliveredOrdersToday,
      deliveredItemsTodayRow,
      driversWithDeliveriesTodayRow,
    ] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository
        .createQueryBuilder('o')
        .where('o.status IN (:...statuses)', { statuses: activeOrderStatuses })
        .getCount(),
      this.userRepository.count(),
      this.customerRepository.count(),
      this.staffRepository.count(),
      this.driverRepository.count(),
      this.driverRepository
        .createQueryBuilder('d')
        .innerJoin('d.user', 'u')
        .where('d.isOnline = :isOnline', { isOnline: true })
        .andWhere('d.status = :status', { status: DriverStatus.ACTIVE })
        .andWhere('u.isActive = :isActive', { isActive: true })
        .getCount(),
      this.orderRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.totalAmount), 0)', 'totalRevenue')
        .where('o.paymentStatus = :paymentStatus', {
          paymentStatus: PaymentStatus.PAID,
        })
        .getRawOne<{ totalRevenue: string }>(),
      this.orderRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.totalAmount), 0)', 'todayRevenue')
        .where('o.status = :status', { status: OrderStatus.DELIVERED })
        .andWhere('o.deliveredAt >= :startOfToday', { startOfToday })
        .andWhere('o.deliveredAt < :endOfToday', { endOfToday })
        .getRawOne<{ todayRevenue: string }>(),
      this.orderRepository
        .createQueryBuilder('o')
        .where('o.status = :status', { status: OrderStatus.DELIVERED })
        .andWhere('o.deliveredAt >= :startOfToday', { startOfToday })
        .andWhere('o.deliveredAt < :endOfToday', { endOfToday })
        .getCount(),
      this.orderItemRepository
        .createQueryBuilder('oi')
        .innerJoin('oi.order', 'o')
        .select('COALESCE(SUM(oi.quantity), 0)', 'deliveredItemsToday')
        .where('o.status = :status', { status: OrderStatus.DELIVERED })
        .andWhere('o.deliveredAt >= :startOfToday', { startOfToday })
        .andWhere('o.deliveredAt < :endOfToday', { endOfToday })
        .getRawOne<{ deliveredItemsToday: string }>(),
      this.orderRepository
        .createQueryBuilder('o')
        .select('COUNT(DISTINCT o.driverId)', 'driversWithDeliveriesToday')
        .where('o.status = :status', { status: OrderStatus.DELIVERED })
        .andWhere('o.driverId IS NOT NULL')
        .andWhere('o.deliveredAt >= :startOfToday', { startOfToday })
        .andWhere('o.deliveredAt < :endOfToday', { endOfToday })
        .getRawOne<{ driversWithDeliveriesToday: string }>(),
    ]);

    return {
      totalOrders,
      activeOrders,
      totalRevenue: Number(totalRevenueRow?.totalRevenue ?? 0),
      activeDrivers,
      totalUsers,
      totalCustomers,
      totalStaffs,
      totalDrivers,

      todayRevenue: Number(todayRevenueRow?.todayRevenue ?? 0),
      deliveredOrdersToday,
      deliveredItemsToday: Number(
        deliveredItemsTodayRow?.deliveredItemsToday ?? 0,
      ),
      driversWithDeliveriesToday: Number(
        driversWithDeliveriesTodayRow?.driversWithDeliveriesToday ?? 0,
      ),
    };
  }

  async getTodayDriverPerformance(limit = 10) {
    const safeLimit = this.normalizeLimit(limit);
    const { startOfToday, endOfToday } = this.getTodayRange();

    const rows = await this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.driver', 'd')
      .innerJoin('d.user', 'u')
      .leftJoin('o.items', 'oi')
      .select('d.userId', 'userId')
      .addSelect('u.fullName', 'fullName')
      .addSelect('u.email', 'email')
      .addSelect('d.isOnline', 'isOnline')
      .addSelect('COUNT(DISTINCT o.id)', 'deliveredOrders')
      .addSelect('COALESCE(SUM(oi.quantity), 0)', 'deliveredItems')
      .where('o.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('o.deliveredAt >= :startOfToday', { startOfToday })
      .andWhere('o.deliveredAt < :endOfToday', { endOfToday })
      .groupBy('d.userId')
      .addGroupBy('u.fullName')
      .addGroupBy('u.email')
      .addGroupBy('d.isOnline')
      .orderBy('COUNT(DISTINCT o.id)', 'DESC')
      .addOrderBy('COALESCE(SUM(oi.quantity), 0)', 'DESC')
      .limit(safeLimit)
      .getRawMany<{
        userId: string;
        fullName: string;
        email: string;
        isOnline: boolean | string;
        deliveredOrders: string;
        deliveredItems: string;
      }>();

    return rows.map((row) => ({
      userId: row.userId,
      fullName: row.fullName,
      email: row.email,
      isOnline:
        row.isOnline === true ||
        row.isOnline === 'true' ||
        row.isOnline === '1',
      deliveredOrders: Number(row.deliveredOrders ?? 0),
      deliveredItems: Number(row.deliveredItems ?? 0),
    }));
  }

  async getAllUsers() {
    const users = await this.userRepository.find({
      relations: ['staffProfile', 'driverProfile'],
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => ({
      id: user.id,
      userId: user.id,
      email: user.email,
      name: user.fullName,
      fullName: user.fullName,
      phone: user.phone ?? '',
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      staff: user.staffProfile
        ? {
            userId: user.staffProfile.userId,
            isActive: user.staffProfile.isActive,
            createdAt: user.staffProfile.createdAt,
          }
        : null,
      driver: user.driverProfile
        ? {
            userId: user.driverProfile.userId,
            status: user.driverProfile.status,
            isOnline: user.driverProfile.isOnline,
            vehicleType: user.driverProfile.vehicleType ?? null,
            licensePlate: user.driverProfile.licensePlate ?? null,
            lastLocationAt: user.driverProfile.lastLocationAt ?? null,
            createdAt: user.driverProfile.createdAt,
          }
        : null,
    }));
  }

  async getRecentOrders(limit = 10) {
    const safeLimit = this.normalizeLimit(limit);

    const orders = await this.orderRepository.find({
      relations: [
        'customer',
        'customer.user',
        'driver',
        'driver.user',
        'items',
      ],
      order: {
        createdAt: 'DESC',
      },
      take: safeLimit,
    });

    return orders.map((order) => ({
      id: order.id,
      customerId: order.customerId,
      customerName: order.customer?.user?.fullName ?? null,
      customerEmail: order.customer?.user?.email ?? null,
      driverId: order.driverId,
      driverName: order.driver?.user?.fullName ?? null,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      itemCount: (order.items || []).reduce(
        (total, item) => total + item.quantity,
        0,
      ),
      deliveryAddress: order.deliveryAddressText ?? null,
      assignedAt: order.assignedAt,
      deliveredAt: order.deliveredAt,
      driverConfirmedDelivered: order.driverConfirmedDelivered,
      customerConfirmedDelivered: order.customerConfirmedDelivered,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }

  async createStaff(dto: CreateStaffDto) {
    await this.ensureEmailAndPhoneAreAvailable(dto.email, dto.phone);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: UserRole.STAFF,
        isActive: dto.isActive ?? true,
      });

      const createdUser = await manager.save(User, user);

      const staff = manager.create(Staff, {
        userId: createdUser.id,
        isActive: dto.isActive ?? true,
      });

      const createdStaff = await manager.save(Staff, staff);

      return this.mapStaffResponse({
        ...createdStaff,
        user: createdUser,
      } as Staff);
    });
  }

  async getAllStaffs() {
    const staffs = await this.staffRepository.find({
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });

    return staffs.map((staff) => this.mapStaffResponse(staff));
  }

  async getStaffDetail(userId: string) {
    const staff = await this.staffRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return this.mapStaffResponse(staff);
  }

  async updateStaff(userId: string, dto: UpdateStaffDto) {
    const staff = await this.staffRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (dto.phone && dto.phone !== staff.user.phone) {
      await this.ensurePhoneIsAvailable(dto.phone, staff.userId);
    }

    if (dto.fullName !== undefined) {
      staff.user.fullName = dto.fullName;
    }

    if (dto.phone !== undefined) {
      staff.user.phone = dto.phone;
    }

    if (dto.isActive !== undefined) {
      staff.user.isActive = dto.isActive;
      staff.isActive = dto.isActive;
    }

    await this.userRepository.save(staff.user);
    await this.staffRepository.save(staff);

    return this.getStaffDetail(userId);
  }

  async createDriver(dto: CreateDriverDto) {
    await this.ensureEmailAndPhoneAreAvailable(dto.email, dto.phone);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: UserRole.DRIVER,
        isActive: dto.isActive ?? true,
      });

      const createdUser = await manager.save(User, user);

      const driver = manager.create(Driver, {
        userId: createdUser.id,
        status: dto.status ?? DriverStatus.ACTIVE,
        isOnline:
          dto.status === DriverStatus.SUSPENDED
            ? false
            : (dto.isOnline ?? false),
        vehicleType: dto.vehicleType,
        licensePlate: dto.licensePlate,
      });

      const createdDriver = await manager.save(Driver, driver);

      return this.mapDriverResponse({
        ...createdDriver,
        user: createdUser,
      } as Driver);
    });
  }

  async getAllDrivers() {
    const drivers = await this.driverRepository.find({
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });

    return drivers.map((driver) => this.mapDriverResponse(driver));
  }

  async getDriverDetail(userId: string) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return this.mapDriverResponse(driver);
  }

  async updateDriver(userId: string, dto: UpdateDriverDto) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (dto.phone && dto.phone !== driver.user.phone) {
      await this.ensurePhoneIsAvailable(dto.phone, driver.userId);
    }

    if (dto.fullName !== undefined) {
      driver.user.fullName = dto.fullName;
    }

    if (dto.phone !== undefined) {
      driver.user.phone = dto.phone;
    }

    if (dto.vehicleType !== undefined) {
      driver.vehicleType = dto.vehicleType;
    }

    if (dto.licensePlate !== undefined) {
      driver.licensePlate = dto.licensePlate;
    }

    if (dto.isActive !== undefined) {
      driver.user.isActive = dto.isActive;

      if (!dto.isActive) {
        driver.isOnline = false;
      }
    }

    if (dto.status !== undefined) {
      driver.status = dto.status;

      if (dto.status === DriverStatus.SUSPENDED) {
        driver.isOnline = false;
        driver.user.isActive = false;
      }

      if (dto.status === DriverStatus.ACTIVE && dto.isActive === undefined) {
        driver.user.isActive = true;
      }
    }

    if (dto.isOnline !== undefined) {
      if (!driver.user.isActive || driver.status === DriverStatus.SUSPENDED) {
        driver.isOnline = false;
      } else {
        driver.isOnline = dto.isOnline;
      }
    }

    await this.userRepository.save(driver.user);
    await this.driverRepository.save(driver);

    return this.getDriverDetail(userId);
  }

  private normalizeLimit(limit?: number): number {
    if (!Number.isFinite(limit) || !limit || limit <= 0) {
      return 10;
    }

    return Math.min(Math.floor(limit), 50);
  }

  private getTodayRange() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    return { startOfToday, endOfToday };
  }

  private async ensureEmailAndPhoneAreAvailable(email: string, phone?: string) {
    const existingByEmail = await this.userRepository.findOne({
      where: { email },
    });

    if (existingByEmail) {
      throw new BadRequestException('Email already exists');
    }

    if (phone) {
      await this.ensurePhoneIsAvailable(phone);
    }
  }

  private async ensurePhoneIsAvailable(phone: string, excludeUserId?: string) {
    const existingByPhone = await this.userRepository.findOne({
      where: { phone },
    });

    if (existingByPhone && existingByPhone.id !== excludeUserId) {
      throw new BadRequestException('Phone already exists');
    }
  }

  private mapStaffResponse(staff: Staff) {
    return {
      userId: staff.userId,
      email: staff.user.email,
      fullName: staff.user.fullName,
      phone: staff.user.phone,
      role: staff.user.role,
      isActive: staff.isActive,
      userIsActive: staff.user.isActive,
      createdAt: staff.createdAt,
    };
  }

  private mapDriverResponse(driver: Driver) {
    return {
      userId: driver.userId,
      email: driver.user.email,
      fullName: driver.user.fullName,
      phone: driver.user.phone,
      role: driver.user.role,
      userIsActive: driver.user.isActive,
      isActive: driver.user.isActive,
      status: driver.status,
      isOnline: driver.isOnline,
      vehicleType: driver.vehicleType,
      licensePlate: driver.licensePlate,
      createdAt: driver.createdAt,
    };
  }
}
