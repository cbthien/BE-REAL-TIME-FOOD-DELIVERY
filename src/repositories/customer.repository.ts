import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/entities/customer.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repository: Repository<Customer>,
  ) {}

  async findByUserId(userId: string): Promise<Customer | null> {
    return this.repository.findOne({
      where: {
        userId,
      },
      relations: ['user', 'defaultAddress', 'cart'],
    });
  }

  async save(customer: Customer): Promise<Customer> {
    return this.repository.save(customer);
  }
}