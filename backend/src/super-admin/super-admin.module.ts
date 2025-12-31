import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { School } from '../schools/entities/school.entity';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { Payment } from '../payments/entities/payment.entity';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';
import { FeeCategory } from '../fee-categories/entities/fee-category.entity';
import { CategoryHead } from '../category-heads/entities/category-head.entity';
import { Class } from '../classes/entities/class.entity';
import { SchoolsModule } from '../schools/schools.module';
import { UsersModule } from '../users/users.module';
import { CategoryHeadsModule } from '../category-heads/category-heads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      School,
      User,
      Student,
      Payment,
      FeeStructure,
      FeeCategory,
      CategoryHead,
      Class,
    ]),
    SchoolsModule,
    UsersModule,
    CategoryHeadsModule,
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
