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
import { School } from '../../schools/entities/school.entity';
import { StudentAcademicRecord } from '../../student-academic-records/entities/student-academic-record.entity';

@Entity('academic_years')
@Unique(['schoolId', 'name']) // Each school can have unique academic year names
export class AcademicYear {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  name!: string; // e.g., "2024-2025"

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ default: false })
  isCurrent!: boolean; // Only one should be current per school

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  schoolId!: number;

  @ManyToOne(() => School, school => school.academicYears)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @OneToMany(() => StudentAcademicRecord, record => record.academicYear)
  studentRecords!: StudentAcademicRecord[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

