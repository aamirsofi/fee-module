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

export enum ClassStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  schoolId!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ClassStatus,
    default: ClassStatus.ACTIVE,
  })
  status!: ClassStatus;

  @ManyToOne(() => School, (school) => school.classes)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

