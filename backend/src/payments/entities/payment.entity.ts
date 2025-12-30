import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { School } from '../../schools/entities/school.entity';
import { Student } from '../../students/entities/student.entity';
import { FeeStructure } from '../../fee-structures/entities/fee-structure.entity';

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  ONLINE = 'online',
  CHEQUE = 'cheque',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  studentId!: number;

  @Column()
  feeStructureId!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  paymentDate!: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod!: PaymentMethod;

  @Column({ nullable: true, unique: true, length: 255 })
  transactionId?: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column()
  schoolId!: number;

  @ManyToOne(() => School, school => school.payments)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToOne(() => Student, student => student.payments)
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @ManyToOne(() => FeeStructure, feeStructure => feeStructure.payments)
  @JoinColumn({ name: 'feeStructureId' })
  feeStructure!: FeeStructure;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
