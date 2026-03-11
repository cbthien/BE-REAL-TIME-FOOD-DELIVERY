import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'drivers' })
export class Driver {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId: string;

  @OneToOne(() => User, (user) => user.driverProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'PENDING',
  })
  status: string;

  @Column({
    name: 'is_online',
    type: 'boolean',
    default: false,
  })
  isOnline: boolean;

  @Column({
    name: 'vehicle_type',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  vehicleType?: string;

  @Column({
    name: 'license_plate',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  licensePlate?: string;

  @Column({
    name: 'approved_by_user_id',
    type: 'bigint',
    nullable: true,
  })
  approvedByUserId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedBy?: User;

  @Column({
    name: 'approved_at',
    type: 'timestamp',
    nullable: true,
  })
  approvedAt?: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;
}