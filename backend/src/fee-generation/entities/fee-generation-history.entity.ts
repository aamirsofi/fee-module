import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { School } from '../../schools/entities/school.entity';
import { AcademicYear } from '../../academic-years/entities/academic-year.entity';

export enum GenerationType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
}

export enum GenerationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('fee_generation_history')
export class FeeGenerationHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: GenerationType,
  })
  type!: GenerationType;

  @Column({
    type: 'enum',
    enum: GenerationStatus,
    default: GenerationStatus.PENDING,
  })
  status!: GenerationStatus;

  @Column()
  schoolId!: number;

  @Column()
  academicYearId!: number;

  @Column()
  totalStudents!: number;

  @Column({ default: 0 })
  feesGenerated!: number;

  @Column({ default: 0 })
  feesFailed!: number;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  generatedByUserId?: number;

  @Column({ nullable: true })
  generatedBy?: string; // User email or name

  @Column({ type: 'json', nullable: true })
  feeStructureIds?: number[]; // Which fee structures were used

  @Column({ type: 'json', nullable: true })
  classIds?: number[]; // Which classes (if bulk generation)

  @Column({ type: 'json', nullable: true })
  studentIds?: number[]; // Which students (if specific generation)

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalAmountGenerated?: number; // Total ₹ amount generated

  @Column({ type: 'json', nullable: true })
  failedStudentDetails?: Array<{ studentId: number; studentName: string; error: string }>; // Detailed failure info

  @ManyToOne(() => School)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academicYearId' })
  academicYear!: AcademicYear;

  @CreateDateColumn()
  createdAt!: Date;
}


