import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeCategoriesService } from './fee-categories.service';
import { FeeCategoriesController } from './fee-categories.controller';
import { FeeCategory } from './entities/fee-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeCategory])],
  controllers: [FeeCategoriesController],
  providers: [FeeCategoriesService],
  exports: [FeeCategoriesService],
})
export class FeeCategoriesModule {}
