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
import { FeeCategory } from '../../fee-categories/entities/fee-category.entity';
import { CategoryHead } from '../../category-heads/entities/category-head.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { StudentFeeStructure } from '../../student-fee-structures/entities/student-fee-structure.entity';
import { Class } from '../../classes/entities/class.entity';

export enum StructureStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('fee_structures')
export class FeeStructure {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  feeCategoryId!: number;

  @Column({ nullable: true })
  categoryHeadId?: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true })
  classId?: number;

  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'classId' })
  class?: Class;

  @Column({ nullable: true, length: 255 })
  academicYear?: string;

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @Column({
    type: 'enum',
    enum: StructureStatus,
    default: StructureStatus.ACTIVE,
  })
  status!: StructureStatus;

  @Column()
  schoolId!: number;

  @ManyToOne(() => School, school => school.feeStructures)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToOne(() => FeeCategory, category => category.feeStructures)
  @JoinColumn({ name: 'feeCategoryId' })
  category!: FeeCategory;

  @ManyToOne(() => CategoryHead, { nullable: true })
  @JoinColumn({ name: 'categoryHeadId' })
  categoryHead?: CategoryHead;

  @OneToMany(() => Payment, payment => payment.feeStructure)
  payments!: Payment[];

  @OneToMany(() => StudentFeeStructure, sf => sf.feeStructure)
  studentStructures!: StudentFeeStructure[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
