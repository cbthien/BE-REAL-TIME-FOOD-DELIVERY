import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateDriverLocationDto {
  @ApiProperty({ example: 10.7769 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 106.7009 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

