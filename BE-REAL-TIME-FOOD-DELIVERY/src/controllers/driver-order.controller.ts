import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/enums/user-role.enum';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { DriverOrderService } from 'src/services/driver-order.service';
import { UpdateDriverLocationDto } from 'src/dto/driver/update-driver-location.dto';

@ApiTags('Driver Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
@Controller('driver/orders')
export class DriverOrderController {
  constructor(private readonly driverOrderService: DriverOrderService) {}

  @ApiOperation({ summary: 'Driver get assigned orders' })
  @Get()
  async getMyOrders(@CurrentUser() user: any) {
    return this.driverOrderService.getMyOrders(user.id);
  }

  @ApiOperation({ summary: 'Driver get assigned order detail' })
  @Get(':id')
  async getMyOrderDetail(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    return this.driverOrderService.getMyOrderDetail(user.id, orderId);
  }

  @ApiOperation({ summary: 'Driver confirm pick up order' })
  @Patch(':id/pick-up')
  async confirmPickUp(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    return this.driverOrderService.confirmPickUp(user.id, orderId);
  }

  @ApiOperation({ summary: 'Driver confirm delivered' })
  @Patch(':id/confirm-delivered')
  async confirmDelivered(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    return this.driverOrderService.confirmDelivered(user.id, orderId);
  }

  @ApiOperation({ summary: 'Driver update current location (lat/lng)' })
  @Patch(':id/location')
  async updateLocation(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: UpdateDriverLocationDto,
  ) {
    return this.driverOrderService.updateLocation(user.id, orderId, dto.lat, dto.lng);
  }
}