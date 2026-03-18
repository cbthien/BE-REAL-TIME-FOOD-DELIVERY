import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { PaymentMethod } from 'src/enums/payment-method.enum';

export class CreateOrderDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 10.7769, description: 'Customer current latitude when placing order' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLat?: number;

  @ApiPropertyOptional({ example: 106.7009, description: 'Customer current longitude when placing order' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLng?: number;
}