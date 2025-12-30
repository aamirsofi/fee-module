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
import { FeeStructure } from '../../fee-structures/entities/fee-structure.entity';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum FeeCategoryType {
  SCHOOL = 'school',
  TRANSPORT = 'transport',
}

@Entity('fee_categories')
export class FeeCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: FeeCategoryType,
    default: FeeCategoryType.SCHOOL,
  })
  type!: FeeCategoryType;

  @Column({
    type: 'enum',
    enum: CategoryStatus,
    default: CategoryStatus.ACTIVE,
  })
  status!: CategoryStatus;

  @Column({ type: 'json', nullable: true })
  applicableMonths?: number[]; // Array of month numbers (1-12), e.g., [1,2,3,4,5,6,7,8,9,10,11,12] for all months

  @Column()
  schoolId!: number;

  @ManyToOne(() => School, school => school.feeCategories)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @OneToMany(() => FeeStructure, feeStructure => feeStructure.category)
  feeStructures!: FeeStructure[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
