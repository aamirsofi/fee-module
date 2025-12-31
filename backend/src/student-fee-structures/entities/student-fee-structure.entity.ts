import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { FeeStructure } from '../../fee-structures/entities/fee-structure.entity';
import { AcademicYear } from '../../academic-years/entities/academic-year.entity';
import { StudentAcademicRecord } from '../../student-academic-records/entities/student-academic-record.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('student_fee_structures')
@Unique(['studentId', 'feeStructureId', 'academicYearId']) // One fee structure per student per academic year
export class StudentFeeStructure {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  studentId!: number;

  @Column()
  feeStructureId!: number;

  @Column()
  academicYearId!: number; // Link to academic year

  @Column({ nullable: true })
  academicRecordId?: number; // Link to student's academic record for that year

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  dueDate!: Date;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @ManyToOne(() => Student, student => student.feeStructures)
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @ManyToOne(() => FeeStructure, feeStructure => feeStructure.studentStructures)
  @JoinColumn({ name: 'feeStructureId' })
  feeStructure!: FeeStructure;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academicYearId' })
  academicYear!: AcademicYear;

  @ManyToOne(() => StudentAcademicRecord, { nullable: true })
  @JoinColumn({ name: 'academicRecordId' })
  academicRecord?: StudentAcademicRecord;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
