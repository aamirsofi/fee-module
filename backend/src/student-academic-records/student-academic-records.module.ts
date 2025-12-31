import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAcademicRecordsService } from './student-academic-records.service';
import { StudentAcademicRecordsController } from './student-academic-records.controller';
import { StudentAcademicRecord } from './entities/student-academic-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentAcademicRecord])],
  controllers: [StudentAcademicRecordsController],
  providers: [StudentAcademicRecordsService],
  exports: [StudentAcademicRecordsService],
})
export class StudentAcademicRecordsModule {}

