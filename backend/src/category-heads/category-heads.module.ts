import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryHeadsService } from './category-heads.service';
import { CategoryHeadsController } from './category-heads.controller';
import { CategoryHead } from './entities/category-head.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryHead])],
  controllers: [CategoryHeadsController],
  providers: [CategoryHeadsService],
  exports: [CategoryHeadsService],
})
export class CategoryHeadsModule {}
