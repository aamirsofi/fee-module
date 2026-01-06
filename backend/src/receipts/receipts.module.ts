import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';
import { PdfGeneratorService } from './pdf-generator.service';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [ReceiptsController],
  providers: [ReceiptsService, PdfGeneratorService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}

