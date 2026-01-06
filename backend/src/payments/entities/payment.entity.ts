import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { School } from '../../schools/entities/school.entity';
import { Student } from '../../students/entities/student.entity';
import { FeeInvoice } from '../../invoices/entities/fee-invoice.entity';

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
@Index(['invoiceId'])
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  studentId!: number; // Keep for quick queries

  // ====== PAYMENT REFERENCE ======
  
  @Column({ nullable: true })
  studentFeeStructureId?: number; // Not used - kept for database compatibility (always null)

  @Column({ nullable: true })
  invoiceId?: number; // Link to fee_invoices (all payments use this)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number; // Payment amount (can be partial)

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

  @Column({ nullable: true, unique: true, length: 100 })
  receiptNumber?: string; // Auto-generated receipt number

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

  @ManyToOne(() => FeeInvoice, invoice => invoice.payments, { nullable: true })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: FeeInvoice;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
