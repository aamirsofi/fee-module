import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';
import { FeeCategory } from '../../fee-categories/entities/fee-category.entity';
import { FeeStructure } from '../../fee-structures/entities/fee-structure.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { CategoryHead } from '../../category-heads/entities/category-head.entity';
import { Class } from '../../classes/entities/class.entity';
import { AcademicYear } from '../../academic-years/entities/academic-year.entity';

export enum SchoolStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ unique: true, length: 255 })
  subdomain!: string;

  @Column({ nullable: true, length: 255 })
  email?: string;

  @Column({ nullable: true, length: 255 })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true, length: 255 })
  logo?: string;

  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: SchoolStatus,
    default: SchoolStatus.ACTIVE,
  })
  status!: SchoolStatus;

  @Column({ nullable: true })
  createdById?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @OneToMany(() => Student, student => student.school)
  students!: Student[];

  @OneToMany(() => FeeCategory, category => category.school)
  feeCategories!: FeeCategory[];

  @OneToMany(() => FeeStructure, feeStructure => feeStructure.school)
  feeStructures!: FeeStructure[];

  @OneToMany(() => Payment, payment => payment.school)
  payments!: Payment[];

  @OneToMany(() => CategoryHead, categoryHead => categoryHead.school)
  categoryHeads!: CategoryHead[];

  @OneToMany(() => Class, classEntity => classEntity.school)
  classes!: Class[];

  @OneToMany(() => AcademicYear, academicYear => academicYear.school)
  academicYears!: AcademicYear[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
