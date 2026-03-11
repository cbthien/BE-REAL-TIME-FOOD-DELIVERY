import {
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Address } from './address.entity';

@Entity({ name: 'customers' })
export class Customer {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId: string;

  @OneToOne(() => User, (user) => user.customerProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'default_address_id' })
  defaultAddress?: Address;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}