// Seed script - creates test users + menu items
// Run: npm run seed
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './modules/auth/user.schema';
import { MenuItem } from './modules/ordering/menu-item.schema';
import { UserRole } from './shared/enums/user-role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const menuItemModel = app.get<Model<MenuItem>>(getModelToken(MenuItem.name));

  console.log('🌱 Seeding database...');

  try {
    // Seed 4 test users
    const password = await bcrypt.hash('123456', 10);
    const users = [
      { email: 'customer@test.com', passwordHash: password, name: 'Customer User', role: UserRole.CUSTOMER },
      { email: 'staff@test.com', passwordHash: password, name: 'Staff User', role: UserRole.STAFF },
      { email: 'driver@test.com', passwordHash: password, name: 'Driver User', role: UserRole.DRIVER },
      { email: 'admin@test.com', passwordHash: password, name: 'Admin User', role: UserRole.ADMIN },
    ];

    for (const user of users) {
      const exists = await userModel.findOne({ email: user.email });
      if (!exists) {
        await userModel.create(user);
        console.log(`✅ Created user: ${user.email}`);
      } else {
        // Update existing user to ensure name and password are correct
        await userModel.updateOne({ email: user.email }, { $set: { name: user.name, role: user.role, passwordHash: user.passwordHash } });
        console.log(`🔄 Updated user: ${user.email}`);
      }
    }

    // Seed 10 menu items
    const menuItems = [
      { name: 'Margherita Pizza', description: 'Tomato, mozzarella, basil', price: 120000, category: 'Main', imageUrl: '', available: true },
      { name: 'Pepperoni Pizza', description: 'Pepperoni, mozzarella, tomato sauce', price: 150000, category: 'Main', imageUrl: '', available: true },
      { name: 'Spaghetti Carbonara', description: 'Pasta with bacon and cream', price: 100000, category: 'Main', imageUrl: '', available: true },
      { name: 'Caesar Salad', description: 'Lettuce, croutons, parmesan', price: 70000, category: 'Appetizer', imageUrl: '', available: true },
      { name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 40000, category: 'Appetizer', imageUrl: '', available: true },
      { name: 'Coca Cola', description: '330ml can', price: 15000, category: 'Beverage', imageUrl: '', available: true },
      { name: 'Orange Juice', description: 'Fresh squeezed', price: 25000, category: 'Beverage', imageUrl: '', available: true },
      { name: 'Tiramisu', description: 'Italian coffee dessert', price: 60000, category: 'Dessert', imageUrl: '', available: true },
      { name: 'Cheesecake', description: 'New York style', price: 65000, category: 'Dessert', imageUrl: '', available: true },
      { name: 'BBQ Chicken Wings', description: 'Grilled with BBQ sauce', price: 90000, category: 'Appetizer', imageUrl: '', available: true },
    ];

    for (const item of menuItems) {
      const exists = await menuItemModel.findOne({ name: item.name });
      if (!exists) {
        await menuItemModel.create(item);
        console.log(`✅ Created menu item: ${item.name}`);
      } else {
        console.log(`⏭️  Menu item already exists: ${item.name}`);
      }
    }

    console.log('🚀 Seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
