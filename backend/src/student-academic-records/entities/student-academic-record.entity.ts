import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { AcademicYear } from '../../academic-years/entities/academic-year.entity';
import { Class } from '../../classes/entities/class.entity';
import { School } from '../../schools/entities/school.entity';
import { StudentFeeStructure } from '../../student-fee-structures/entities/student-fee-structure.entity';

export enum AcademicRecordStatus {
  ACTIVE = 'active',
  PROMOTED = 'promoted',
  REPEATING = 'repeating',
  TRANSFERRED = 'transferred',
  DROPPED = 'dropped',
}

@Entity('student_academic_records')
@Unique(['studentId', 'academicYearId']) // One record per student per academic year
export class StudentAcademicRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  studentId!: number;

  @Column()
  academicYearId!: number;

  @Column()
  classId!: number; // Linked to Classes entity

  @Column()
  schoolId!: number; // Direct reference to school for performance and data integrity

  @Column({ nullable: true, length: 50 })
  section?: string; // e.g., "A", "B"

  @Column({ nullable: true, length: 50 })
  rollNumber?: string; // Roll number in that class

  @Column({ nullable: true, length: 255 })
  admissionNumber?: string; // If new admission in this year

  @Column({
    type: 'enum',
    enum: AcademicRecordStatus,
    default: AcademicRecordStatus.ACTIVE,
  })
  status!: AcademicRecordStatus;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @ManyToOne(() => Student, student => student.academicRecords)
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @ManyToOne(() => AcademicYear, academicYear => academicYear.studentRecords)
  @JoinColumn({ name: 'academicYearId' })
  academicYear!: AcademicYear;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'classId' })
  class!: Class;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @OneToMany(() => StudentFeeStructure, sfs => sfs.academicRecord)
  feeStructures!: StudentFeeStructure[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

