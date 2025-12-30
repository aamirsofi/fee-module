import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeStructuresService } from './fee-structures.service';
import { FeeStructuresController } from './fee-structures.controller';
import { FeeStructure } from './entities/fee-structure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeStructure])],
  controllers: [FeeStructuresController],
  providers: [FeeStructuresService],
  exports: [FeeStructuresService],
})
export class FeeStructuresModule {}
