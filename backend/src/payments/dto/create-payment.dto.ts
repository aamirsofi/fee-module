import { IsNumber, IsDateString, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  studentId!: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  feeStructureId!: number;

  @ApiProperty({ example: 5000.0 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ example: '2024-12-29' })
  @IsDateString()
  paymentDate!: string;

  @ApiProperty({ enum: PaymentMethod, required: false })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({ required: false, example: 'TXN123456' })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiProperty({ enum: PaymentStatus, required: false })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
