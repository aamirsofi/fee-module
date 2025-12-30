import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentFeeStructure } from './entities/student-fee-structure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentFeeStructure])],
  exports: [TypeOrmModule],
})
export class StudentFeeStructuresModule {}
