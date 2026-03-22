import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { Staff } from '../entities/staff.entity';
import { Driver } from '../entities/driver.entity';
import { Address } from '../entities/address.entity';
import { MenuCategory } from '../entities/menu-category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemImage } from '../entities/menu-item-image.entity';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Wallet } from '../entities/wallet.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';

const isProduction = process.env.NODE_ENV === 'production';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '123456',
  database: process.env.DB_NAME ?? 'real_time_food_delivery',
  synchronize: process.env.DB_SYNCHRONIZE
    ? process.env.DB_SYNCHRONIZE === 'true'
    : !isProduction,
  logging: process.env.DB_LOGGING === 'true',
  retryAttempts: Number(process.env.DB_RETRY_ATTEMPTS ?? 3),
  retryDelay: Number(process.env.DB_RETRY_DELAY ?? 1000),
  entities: [
    User,
    Customer,
    Staff,
    Driver,
    Address,
    MenuCategory,
    MenuItem,
    MenuItemImage,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Wallet,
    WalletTransaction,
  ],
};