import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'customer1@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Nguyen Van A',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: '123456',
    minLength: 6,
  })
  @IsString()
  @Length(6, 100)
  password: string;

  @ApiProperty({
    example: '0901234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}