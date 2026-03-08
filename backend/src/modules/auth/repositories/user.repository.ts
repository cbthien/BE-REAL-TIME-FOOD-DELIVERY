import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    role: string;
  }): Promise<User> {
    const user = new this.userModel(data);
    await user.save();
    return user;
  }
}
