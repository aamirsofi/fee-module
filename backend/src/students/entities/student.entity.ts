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
import { School } from '../../schools/entities/school.entity';
import { User } from '../../users/entities/user.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { StudentFeeStructure } from '../../student-fee-structures/entities/student-fee-structure.entity';
import { StudentAcademicRecord } from '../../student-academic-records/entities/student-academic-record.entity';
import { Route } from '../../routes/entities/route.entity';
import { RoutePlan } from '../../route-plans/entities/route-plan.entity';
import { CategoryHead } from '../../category-heads/entities/category-head.entity';

export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  GRADUATED = 'graduated',
  TRANSFERRED = 'transferred',
}

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  userId?: number;

  // Permanent Student Information
  @Column({ length: 255, unique: true })
  studentId!: string; // Permanent student ID (doesn't change)

  @Column({ length: 255 })
  firstName!: string;

  @Column({ length: 255 })
  lastName!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true, length: 20 })
  gender?: string; // 'male', 'female', 'other'

  @Column({ nullable: true, length: 10 })
  bloodGroup?: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ nullable: true, length: 255 })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'date' })
  admissionDate!: Date; // First admission date

  @Column({ nullable: true, length: 255 })
  admissionNumber?: string; // Original admission number

  @Column({ nullable: true, length: 500 })
  photoUrl?: string;

  // Parent/Guardian Information
  @Column({ nullable: true, length: 255 })
  parentName?: string;

  @Column({ nullable: true, length: 255 })
  parentEmail?: string;

  @Column({ nullable: true, length: 255 })
  parentPhone?: string;

  @Column({ nullable: true, length: 255 })
  parentRelation?: string; // 'father', 'mother', 'guardian'

  // Route and Transport Information
  @Column({ nullable: true })
  routeId?: number; // Assigned route

  @Column({ nullable: true })
  routePlanId?: number; // Assigned route plan (bus fee structure)

  @Column({ nullable: true, length: 50 })
  busNumber?: string;

  @Column({ nullable: true, length: 50 })
  busSeatNumber?: string;

  @Column({ nullable: true, length: 50 })
  shift?: string; // 'morning', 'afternoon', 'evening'

  // Financial Information
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  openingBalance?: number;

  // Bank Account Information
  @Column({ nullable: true, length: 255 })
  bankName?: string;

  @Column({ nullable: true, length: 255 })
  branchName?: string;

  @Column({ nullable: true, length: 20 })
  bankIfsc?: string;

  @Column({ nullable: true, length: 50 })
  bankAccountNumber?: string;

  // Additional Information
  @Column({ nullable: true, length: 50 })
  penNumber?: string;

  @Column({ nullable: true, length: 20 })
  aadharNumber?: string;

  @Column({ nullable: true, length: 50 })
  admissionFormNumber?: string;

  @Column({ nullable: true, length: 20 })
  whatsappNo?: string;

  @Column({ nullable: true })
  categoryHeadId?: number; // Fee category head assignment

  @Column({ nullable: true, default: false })
  isSibling?: boolean;

  // Overall Status (not year-specific)
  @Column({
    type: 'enum',
    enum: StudentStatus,
    default: StudentStatus.ACTIVE,
  })
  status!: StudentStatus;

  @Column()
  schoolId!: number;

  // Relations
  @ManyToOne(() => School, school => school.students)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @OneToMany(() => StudentAcademicRecord, record => record.student)
  academicRecords!: StudentAcademicRecord[];

  @OneToMany(() => Payment, payment => payment.student)
  payments!: Payment[];

  @OneToMany(() => StudentFeeStructure, sf => sf.student)
  feeStructures!: StudentFeeStructure[];

  @ManyToOne(() => Route, { nullable: true })
  @JoinColumn({ name: 'routeId' })
  route?: Route;

  @ManyToOne(() => RoutePlan, { nullable: true })
  @JoinColumn({ name: 'routePlanId' })
  routePlan?: RoutePlan;

  @ManyToOne(() => CategoryHead, { nullable: true })
  @JoinColumn({ name: 'categoryHeadId' })
  categoryHead?: CategoryHead;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
