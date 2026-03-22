import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateDriverDto } from 'src/dto/admin/create-driver.dto';
import { CreateStaffDto } from 'src/dto/admin/create-staff.dto';
import { UpdateDriverDto } from 'src/dto/admin/update-driver.dto';
import { UpdateStaffDto } from 'src/dto/admin/update-staff.dto';
import { CreateMenuCategoryDto } from 'src/dto/menu/create-menu-category.dto';
import { CreateMenuItemDto } from 'src/dto/menu/create-menu-item.dto';
import { MenuItemQueryDto } from 'src/dto/menu/menu-item-query.dto';
import { UpdateMenuCategoryDto } from 'src/dto/menu/update-menu-category.dto';
import { UpdateMenuItemDto } from 'src/dto/menu/update-menu-item.dto';
import { UserRole } from 'src/enums/user-role.enum';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { AdminService } from 'src/services/admin.service';
import { MenuService } from 'src/services/menu.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly menuService: MenuService,
  ) {}

  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @ApiOperation({ summary: 'Get driver performance today for admin dashboard' })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
  })
  @Get('dashboard/drivers/today')
  async getTodayDriverPerformance(@Query('limit') limit?: string) {
    return this.adminService.getTodayDriverPerformance(
      limit ? Number(limit) : 10,
    );
  }

  @ApiOperation({ summary: 'Get all users overview for admin dashboard' })
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @ApiOperation({ summary: 'Get recent orders for admin dashboard' })
  @Get('orders')
  async getRecentOrders(@Query('limit') limit?: string) {
    return this.adminService.getRecentOrders(limit ? Number(limit) : 10);
  }

  @ApiOperation({ summary: 'Create staff account' })
  @Post('staffs')
  async createStaff(@Body() dto: CreateStaffDto) {
    return this.adminService.createStaff(dto);
  }

  @ApiOperation({ summary: 'Get all staff accounts' })
  @Get('staffs')
  async getAllStaffs() {
    return this.adminService.getAllStaffs();
  }

  @ApiOperation({ summary: 'Get staff detail by userId' })
  @ApiParam({ name: 'userId', description: 'User ID of the staff account' })
  @Get('staffs/:userId')
  async getStaffDetail(@Param('userId') userId: string) {
    return this.adminService.getStaffDetail(userId);
  }

  @ApiOperation({ summary: 'Update staff account by userId' })
  @ApiParam({ name: 'userId', description: 'User ID of the staff account' })
  @Patch('staffs/:userId')
  async updateStaff(
    @Param('userId') userId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.adminService.updateStaff(userId, dto);
  }

  @ApiOperation({ summary: 'Create driver account' })
  @Post('drivers')
  async createDriver(@Body() dto: CreateDriverDto) {
    return this.adminService.createDriver(dto);
  }

  @ApiOperation({ summary: 'Get all driver accounts' })
  @Get('drivers')
  async getAllDrivers() {
    return this.adminService.getAllDrivers();
  }

  @ApiOperation({ summary: 'Get driver detail by userId' })
  @ApiParam({ name: 'userId', description: 'User ID of the driver account' })
  @Get('drivers/:userId')
  async getDriverDetail(@Param('userId') userId: string) {
    return this.adminService.getDriverDetail(userId);
  }

  @ApiOperation({ summary: 'Update driver account by userId' })
  @ApiParam({ name: 'userId', description: 'User ID of the driver account' })
  @Patch('drivers/:userId')
  async updateDriver(
    @Param('userId') userId: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.adminService.updateDriver(userId, dto);
  }

  @ApiOperation({ summary: 'Get all menu categories for admin' })
  @Get('menu/categories')
  async getAdminCategories() {
    return this.menuService.getAdminCategories();
  }

  @ApiOperation({ summary: 'Create menu category for admin' })
  @Post('menu/categories')
  async createMenuCategory(@Body() dto: CreateMenuCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @ApiOperation({ summary: 'Update menu category for admin' })
  @Patch('menu/categories/:id')
  async updateMenuCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuCategoryDto,
  ) {
    return this.menuService.updateCategory(id, dto);
  }

  @ApiOperation({ summary: 'Delete menu category for admin (soft delete)' })
  @Delete('menu/categories/:id')
  async deleteMenuCategory(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.deleteCategory(id);
  }

  @ApiOperation({ summary: 'Get all menu items for admin' })
  @Get('menu/items')
  async getAdminMenuItems(@Query() queryDto: MenuItemQueryDto) {
    return this.menuService.getAdminMenuItems(queryDto);
  }

  @ApiOperation({ summary: 'Get menu item detail for admin' })
  @Get('menu/items/:id')
  async getAdminMenuItemDetail(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.getAdminMenuItemDetail(id);
  }

  @ApiOperation({ summary: 'Create menu item for admin' })
  @Post('menu/items')
  async createMenuItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createMenuItem(dto);
  }

  @ApiOperation({ summary: 'Update menu item for admin' })
  @Patch('menu/items/:id')
  async updateMenuItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateMenuItem(id, dto);
  }

  @ApiOperation({ summary: 'Delete menu item for admin (soft delete)' })
  @Delete('menu/items/:id')
  async deleteMenuItem(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.deleteMenuItem(id);
  }
}
