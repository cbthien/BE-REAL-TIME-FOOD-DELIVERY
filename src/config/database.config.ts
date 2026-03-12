import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { Staff } from '../entities/staff.entity';
import { Driver } from '../entities/driver.entity';
import { Address } from '../entities/address.entity';
import { MenuCategory } from 'src/entities/menu-category.entity';
import { MenuItem } from 'src/entities/menu-item.entity';
import { MenuItemImage } from 'src/entities/menu-item-image.entity';
import { Cart } from 'src/entities/cart.entity';
import { CartItem } from 'src/entities/cart-item.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '123456',
  database: 'real_time_food_delivery',
  synchronize: true,
  logging: true,
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
  ],
};