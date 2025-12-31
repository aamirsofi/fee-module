import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { School } from './entities/school.entity';
import { User } from '../users/entities/user.entity';
import { FeeCategory } from '../fee-categories/entities/fee-category.entity';
import { CategoryHead } from '../category-heads/entities/category-head.entity';
import { Class } from '../classes/entities/class.entity';
import { Route } from '../routes/entities/route.entity';
import { Student } from '../students/entities/student.entity';
import { Payment } from '../payments/entities/payment.entity';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';
import { RoutePlan } from '../route-plans/entities/route-plan.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      School,
      User,
      FeeCategory,
      CategoryHead,
      Class,
      Route,
      Student,
      Payment,
      FeeStructure,
      RoutePlan,
    ]),
    UsersModule,
  ],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
