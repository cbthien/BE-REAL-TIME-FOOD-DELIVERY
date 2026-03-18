import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { Wallet } from '../entities/wallet.entity';
import { LoginDto } from '../dto/auth/login.dto';
import { RegisterDto } from '../dto/auth/register.dto';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async registerCustomer(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: UserRole.CUSTOMER,
        isActive: true,
      });

      const createdUser = await manager.save(User, user);

      const customer = manager.create(Customer, {
        userId: createdUser.id,
      });

      await manager.save(Customer, customer);

      const wallet = manager.create(Wallet, {
        customerId: createdUser.id,
        balance: 0,
      });

      await manager.save(Wallet, wallet);

      return createdUser;
    });

    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.fullName,
        role: savedUser.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordMatched = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async validateUserById(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
  }
}