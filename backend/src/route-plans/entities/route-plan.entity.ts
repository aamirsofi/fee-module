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
import { FeeCategory } from '../../fee-categories/entities/fee-category.entity';
import { CategoryHead } from '../../category-heads/entities/category-head.entity';
import { Route } from '../../routes/entities/route.entity';
import { Class } from '../../classes/entities/class.entity';

export enum RoutePlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('route_plans')
export class RoutePlan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  routeId!: number;

  @Column()
  feeCategoryId!: number; // Transport fee category (Fee Heading of type transport)

  @Column({ nullable: true })
  categoryHeadId?: number;

  @Column({ nullable: true })
  classId?: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: RoutePlanStatus,
    default: RoutePlanStatus.ACTIVE,
  })
  status!: RoutePlanStatus;

  @Column()
  schoolId!: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToOne(() => Route)
  @JoinColumn({ name: 'routeId' })
  route!: Route;

  @ManyToOne(() => FeeCategory)
  @JoinColumn({ name: 'feeCategoryId' })
  feeCategory!: FeeCategory;

  @ManyToOne(() => CategoryHead, { nullable: true })
  @JoinColumn({ name: 'categoryHeadId' })
  categoryHead?: CategoryHead;

  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'classId' })
  class?: Class;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

