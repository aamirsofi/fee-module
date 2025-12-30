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

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('student_fee_structures')
@Unique(['studentId', 'feeStructureId'])
export class StudentFeeStructure {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  studentId!: number;

  @Column()
  feeStructureId!: number;

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
