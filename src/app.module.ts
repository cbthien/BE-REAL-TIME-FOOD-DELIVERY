import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';

import { User } from './entities/user.entity';
import { Customer } from './entities/customer.entity';
import { Staff } from './entities/staff.entity';
import { Driver } from './entities/driver.entity';
import { Address } from './entities/address.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { MenuItemImage } from './entities/menu-item-image.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';

import { AuthController } from './controllers/auth.controller';
import { MenuController } from './controllers/menu.controller';
import { CartController } from './controllers/cart.controller';
import { OrderController } from './controllers/order.controller';

import { AuthService } from './services/auth.service';
import { MenuService } from './services/menu.service';
import { CartService } from './services/cart.service';
import { OrderService } from './services/order.service';

import { JwtStrategy } from './auth/jwt.strategy';
import { AuthModule } from './auth/auth.module';

import { MenuCategoryRepository } from './repositories/menu-category.repository';
import { MenuItemRepository } from './repositories/menu-item.repository';
import { CustomerRepository } from './repositories/customer.repository';
import { CartRepository } from './repositories/cart.repository';
import { CartItemRepository } from './repositories/cart-item.repository';
import { OrderRepository } from './repositories/order.repository';
import { OrderItemRepository } from './repositories/order-item.repository';
import { WalletRepository } from './repositories/wallet.repository';
import { WalletTransactionRepository} from './repositories/wallet-transaction.repository';

import { MenuSeedService } from './seeds/menu.seed';
import { AdminSeedService } from './seeds/admin.seed';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    
    TypeOrmModule.forFeature([
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
    ]),

    AuthModule,

    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: {
        expiresIn: jwtConfig.expiresIn,
      },
    }),
  ],

  controllers: [
    AuthController,
    MenuController,
    CartController,
    OrderController,
  ],

  providers: [
    AuthService,
    MenuService,
    CartService,
    OrderService,
    JwtStrategy,
    MenuCategoryRepository,
    MenuItemRepository,
    CustomerRepository,
    CartRepository,
    CartItemRepository,
    OrderRepository,
    OrderItemRepository,
    WalletRepository,
    WalletTransactionRepository,

    MenuSeedService,
    AdminSeedService,
  ],
})
export class AppModule {}