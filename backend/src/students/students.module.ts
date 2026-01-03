import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student } from './entities/student.entity';
import { School } from '../schools/entities/school.entity';
import { Route } from '../routes/entities/route.entity';
import { RoutePlan } from '../route-plans/entities/route-plan.entity';
import { CategoryHead } from '../category-heads/entities/category-head.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, School, Route, RoutePlan, CategoryHead])],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
