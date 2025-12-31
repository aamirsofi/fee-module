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

export enum RouteStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: RouteStatus,
    default: RouteStatus.ACTIVE,
  })
  status!: RouteStatus;

  @Column()
  schoolId!: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

