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

export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  GRADUATED = 'graduated',
}

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  userId?: number;

  @Column({ length: 255 })
  studentId!: string;

  @Column({ length: 255 })
  firstName!: string;

  @Column({ length: 255 })
  lastName!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ nullable: true, length: 255 })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ length: 255 })
  class!: string;

  @Column({ nullable: true, length: 255 })
  section?: string;

  @Column({
    type: 'enum',
    enum: StudentStatus,
    default: StudentStatus.ACTIVE,
  })
  status!: StudentStatus;

  @Column()
  schoolId!: number;

  @ManyToOne(() => School, school => school.students)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @OneToMany(() => Payment, payment => payment.student)
  payments!: Payment[];

  @OneToMany(() => StudentFeeStructure, sf => sf.student)
  feeStructures!: StudentFeeStructure[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
