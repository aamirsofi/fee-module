import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School, SchoolStatus } from './entities/school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { FeeCategory, FeeCategoryType } from '../fee-categories/entities/fee-category.entity';
import { CategoryHead } from '../category-heads/entities/category-head.entity';
import { Class } from '../classes/entities/class.entity';
import { Route, RouteStatus } from '../routes/entities/route.entity';
import { Student } from '../students/entities/student.entity';
import { Payment } from '../payments/entities/payment.entity';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';
import { RoutePlan } from '../route-plans/entities/route-plan.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private schoolsRepository: Repository<School>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(FeeCategory)
    private feeCategoriesRepository: Repository<FeeCategory>,
    @InjectRepository(CategoryHead)
    private categoryHeadsRepository: Repository<CategoryHead>,
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    @InjectRepository(Route)
    private routesRepository: Repository<Route>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(FeeStructure)
    private feeStructuresRepository: Repository<FeeStructure>,
    @InjectRepository(RoutePlan)
    private routePlansRepository: Repository<RoutePlan>,
  ) {}

  async create(createSchoolDto: CreateSchoolDto, createdById: number): Promise<School> {
    // Create the school
    const school = this.schoolsRepository.create({
      ...createSchoolDto,
      createdById,
    });
    const savedSchool = await this.schoolsRepository.save(school);

    // Auto-create default admin user for the school
    await this.createDefaultAdminUser(savedSchool);

    // Auto-create default data for the school
    await this.initializeDefaultData(savedSchool);

    return savedSchool;
  }

  private async createDefaultAdminUser(school: School): Promise<User> {
    // Generate default admin email: admin@<subdomain>.school
    const defaultEmail = `admin@${school.subdomain}.school`;
    const defaultPassword = `${school.subdomain}_admin123`; // Default password, should be changed on first login

    // Check if admin user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: defaultEmail },
    });

    if (existingUser) {
      // If user exists, just update schoolId if needed
      if (!existingUser.schoolId) {
        existingUser.schoolId = school.id;
        await this.usersRepository.save(existingUser);
      }
      return existingUser;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const adminUser = this.usersRepository.create({
      name: `${school.name} Administrator`,
      email: defaultEmail,
      password: hashedPassword,
      role: UserRole.ADMINISTRATOR,
      schoolId: school.id,
    });

    const savedUser = await this.usersRepository.save(adminUser);

    // Log credentials (in production, send via email or secure channel)
    console.log(`\n✅ Default admin user created for school: ${school.name}`);
    console.log(`📧 Email: ${defaultEmail}`);
    console.log(`🔑 Password: ${defaultPassword}`);
    console.log(`⚠️  Please change password on first login!\n`);

    return savedUser;
  }

  /**
   * Initialize default data for a newly created school
   */
  private async initializeDefaultData(school: School): Promise<void> {
    try {
      console.log(`\n🚀 Initializing default data for school: ${school.name}`);

      // Create default fee categories
      await this.createDefaultFeeCategories(school);
      console.log(`   ✅ Default fee categories created`);

      // Create default category head
      await this.createDefaultCategoryHead(school);
      console.log(`   ✅ Default category head created`);

      // Create default classes
      await this.createDefaultClasses(school);
      console.log(`   ✅ Default classes created (1st - 12th)`);

      // Create default routes
      await this.createDefaultRoutes(school);
      console.log(`   ✅ Default routes created (FREE, Route A, B, C)`);

      console.log(`\n✅ All default data initialized successfully for school: ${school.name}\n`);
    } catch (error) {
      console.error(`❌ Error initializing default data for school ${school.name}:`, error);
      // Don't throw - school creation should succeed even if defaults fail
    }
  }

  /**
   * Create default fee categories (Fee Headings)
   */
  private async createDefaultFeeCategories(school: School): Promise<void> {
    const defaultCategories = [
      { name: 'Tuition Fee', type: FeeCategoryType.SCHOOL, description: 'Monthly tuition fee' },
      { name: 'Transport Fee', type: FeeCategoryType.TRANSPORT, description: 'Transportation fee' },
      {
        name: 'Library Fee',
        type: FeeCategoryType.SCHOOL,
        description: 'Library and reading materials fee',
      },
      {
        name: 'Sports Fee',
        type: FeeCategoryType.SCHOOL,
        description: 'Sports and physical education fee',
      },
      {
        name: 'Lab Fee',
        type: FeeCategoryType.SCHOOL,
        description: 'Laboratory and practical fee',
      },
      {
        name: 'Examination Fee',
        type: FeeCategoryType.SCHOOL,
        description: 'Examination and assessment fee',
      },
    ];

    for (const categoryData of defaultCategories) {
      // Check if category already exists
      const existing = await this.feeCategoriesRepository.findOne({
        where: {
          name: categoryData.name,
          schoolId: school.id,
        },
      });

      if (!existing) {
        const category = this.feeCategoriesRepository.create({
          ...categoryData,
          schoolId: school.id,
        });
        await this.feeCategoriesRepository.save(category);
      }
    }
  }

  /**
   * Create default category head
   */
  private async createDefaultCategoryHead(school: School): Promise<void> {
    const existing = await this.categoryHeadsRepository.findOne({
      where: {
        name: 'General',
        schoolId: school.id,
      },
    });

    if (!existing) {
      const categoryHead = this.categoryHeadsRepository.create({
        name: 'General',
        description: 'General category head for miscellaneous fees',
        schoolId: school.id,
      });
      await this.categoryHeadsRepository.save(categoryHead);
    }
  }

  /**
   * Create default classes (1st through 12th)
   */
  private async createDefaultClasses(school: School): Promise<void> {
    const classNames = [
      '1st',
      '2nd',
      '3rd',
      '4th',
      '5th',
      '6th',
      '7th',
      '8th',
      '9th',
      '10th',
      '11th',
      '12th',
    ];

    for (const className of classNames) {
      // Check if class already exists
      const existing = await this.classesRepository.findOne({
        where: {
          name: className,
          schoolId: school.id,
        },
      });

      if (!existing) {
        const classEntity = this.classesRepository.create({
          name: className,
          schoolId: school.id,
        });
        await this.classesRepository.save(classEntity);
      }
    }
  }

  /**
   * Create default routes (FREE, Route A, Route B, Route C)
   */
  private async createDefaultRoutes(school: School): Promise<void> {
    const defaultRoutes = [
      {
        name: 'FREE',
        description: 'No transport route - students manage their own transportation',
      },
      { name: 'Route A', description: 'Default transport route A' },
      { name: 'Route B', description: 'Default transport route B' },
      { name: 'Route C', description: 'Default transport route C' },
    ];

    for (const routeData of defaultRoutes) {
      // Check if route already exists
      const existing = await this.routesRepository.findOne({
        where: {
          name: routeData.name,
          schoolId: school.id,
        },
      });

      if (!existing) {
        const route = this.routesRepository.create({
          ...routeData,
          schoolId: school.id,
          status: RouteStatus.ACTIVE,
        });
        await this.routesRepository.save(route);
      }
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    includeInactive: boolean = false,
    search?: string,
    status?: string,
  ) {
    const { skip, limit: take } = this.getPaginationParams(page, limit);

    const queryBuilder = this.schoolsRepository
      .createQueryBuilder('school')
      .leftJoinAndSelect('school.createdBy', 'createdBy')
      .orderBy('school.createdAt', 'DESC');

    // IMPORTANT: By default, only show active schools to prevent adding data to inactive/suspended schools
    // Only show inactive/suspended schools if explicitly requested via includeInactive=true or status filter
    if (status && status !== 'all') {
      queryBuilder.where('school.status = :status', { status });
    } else if (!includeInactive) {
      // Default behavior: only show active schools
      queryBuilder.where('school.status = :status', { status: SchoolStatus.ACTIVE });
    }

    // Search filter
    if (search) {
      const searchCondition =
        '(school.name ILIKE :search OR school.subdomain ILIKE :search OR school.email ILIKE :search)';
      if (queryBuilder.expressionMap.wheres.length > 0) {
        queryBuilder.andWhere(searchCondition, { search: `%${search}%` });
      } else {
        queryBuilder.where(searchCondition, { search: `%${search}%` });
      }
    }

    const [data, total] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    return this.createPaginatedResponse(data, total, page, limit);
  }

  private getPaginationParams(page?: number, limit?: number) {
    const pageNum = page ? Math.max(1, page) : 1;
    const limitNum = limit ? Math.max(1, Math.min(100, limit)) : 10;
    const skip = (pageNum - 1) * limitNum;

    return {
      page: pageNum,
      limit: limitNum,
      skip,
    };
  }

  private createPaginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: number): Promise<School> {
    const school = await this.schoolsRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return school;
  }

  async findBySubdomain(subdomain: string): Promise<School | null> {
    return await this.schoolsRepository.findOne({
      where: { subdomain },
    });
  }

  async update(id: number, updateSchoolDto: UpdateSchoolDto): Promise<School> {
    const school = await this.findOne(id);
    Object.assign(school, updateSchoolDto);
    return await this.schoolsRepository.save(school);
  }

  /**
   * Deactivate a school (soft delete) - sets status to INACTIVE
   * This preserves all data for audit and recovery purposes
   * @param id School ID
   * @param suspend If true, sets status to SUSPENDED instead of INACTIVE
   */
  async deactivate(id: number, suspend: boolean = false): Promise<School> {
    const school = await this.findOne(id);

    if (school.status === SchoolStatus.INACTIVE) {
      throw new BadRequestException(`School "${school.name}" is already inactive`);
    }

    if (school.status === SchoolStatus.SUSPENDED) {
      throw new BadRequestException(`School "${school.name}" is already suspended`);
    }

    school.status = suspend ? SchoolStatus.SUSPENDED : SchoolStatus.INACTIVE;
    const updatedSchool = await this.schoolsRepository.save(school);

    console.log(
      `\n${suspend ? '⏸️' : '🚫'} School "${school.name}" has been ${suspend ? 'suspended' : 'deactivated'}\n`,
    );

    return updatedSchool;
  }

  /**
   * Reactivate a school - sets status back to ACTIVE
   * @param id School ID
   */
  async reactivate(id: number): Promise<School> {
    const school = await this.findOne(id);

    if (school.status === SchoolStatus.ACTIVE) {
      throw new BadRequestException(`School "${school.name}" is already active`);
    }

    school.status = SchoolStatus.ACTIVE;
    const updatedSchool = await this.schoolsRepository.save(school);

    console.log(`\n✅ School "${school.name}" has been reactivated\n`);

    return updatedSchool;
  }

  /**
   * Hard delete a school and all its related data
   * WARNING: This permanently deletes all data. Use only in extreme cases.
   * @param id School ID
   * @param force If true, deletes even if there are payments (for audit purposes, payments are usually kept)
   */
  async hardDelete(id: number, force: boolean = false): Promise<void> {
    const school = await this.findOne(id);

    // Check for payments (important for financial audit)
    const paymentCount = await this.paymentsRepository.count({
      where: { schoolId: id },
    });

    if (paymentCount > 0 && !force) {
      throw new BadRequestException(
        `Cannot delete school "${school.name}" because it has ${paymentCount} payment record(s). ` +
          `Payments are kept for audit purposes. If you really want to delete, use force=true. ` +
          `Note: This will permanently delete all financial records.`,
      );
    }

    console.log(`\n🗑️  Starting hard deletion of school: ${school.name} (ID: ${id})`);
    console.log(`⚠️  WARNING: This will permanently delete all data!\n`);

    try {
      // Delete in proper order to avoid foreign key violations
      // 1. Route Plans (depends on Routes, FeeCategories, CategoryHeads, Classes)
      const routePlanCount = await this.routePlansRepository.count({
        where: { schoolId: id },
      });
      if (routePlanCount > 0) {
        await this.routePlansRepository.delete({ schoolId: id });
        console.log(`   ✅ Deleted ${routePlanCount} route plan(s)`);
      }

      // 2. Routes
      const routeCount = await this.routesRepository.count({
        where: { schoolId: id },
      });
      if (routeCount > 0) {
        await this.routesRepository.delete({ schoolId: id });
        console.log(`   ✅ Deleted ${routeCount} route(s)`);
      }

      // 3. Fee Structures (depends on FeeCategories, CategoryHeads, Classes)
      const feeStructureCount = await this.feeStructuresRepository.count({
        where: { schoolId: id },
      });
      if (feeStructureCount > 0) {
        await this.feeStructuresRepository.delete({ schoolId: id });
        console.log(`   ✅ Deleted ${feeStructureCount} fee structure(s)`);
      }

      // 4. Payments (only if force=true)
      if (force && paymentCount > 0) {
        await this.paymentsRepository.delete({ schoolId: id });
        console.log(`   ⚠️  Deleted ${paymentCount} payment(s) (forced deletion)`);
      }

      // 5. Students
      const studentCount = await this.studentsRepository.count({
        where: { schoolId: id },
      });
      if (studentCount > 0) {
        await this.studentsRepository.delete({ schoolId: id });
        console.log(`   ✅ Deleted ${studentCount} student(s)`);
      }

      // 6. Fee Categories
      const feeCategoryCount = await this.feeCategoriesRepository.count({
        where: { schoolId: id },
      });
      if (feeCategoryCount > 0) {
        await this.feeCategoriesRepository.delete({ schoolId: id });
        console.log(`   ✅ Deleted ${feeCategoryCount} fee categor(ies)`);
      }

      // 7. Category Heads
      const categoryHeadCount = await this.categoryHeadsRepository.count({
        where: { schoolId: id },
      });
      if (categoryHeadCount > 0) {
        await this.categoryHeadsRepository.delete({ schoolId: id });
        console.log(`   ✅ Deleted ${categoryHeadCount} category head(s)`);
      }

      // 8. Classes
      const classCount = await this.classesRepository.count({
        where: { schoolId: id },
      });
      if (classCount > 0) {
        await this.classesRepository.delete({ schoolId: id });
        console.log(`   ✅ Deleted ${classCount} class(es)`);
      }

      // 9. Users (except the creator)
      const userCount = await this.usersRepository.count({
        where: { schoolId: id },
      });
      if (userCount > 0) {
        await this.usersRepository.delete({ schoolId: id });
        console.log(`   ✅ Deleted ${userCount} user(s)`);
      }

      // 10. Finally, delete the school
      await this.schoolsRepository.remove(school);
      console.log(`\n✅ School "${school.name}" and all related data deleted successfully\n`);
    } catch (error) {
      console.error(`❌ Error deleting school ${school.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete school: ${errorMessage}`);
    }
  }

  /**
   * @deprecated Use deactivate() instead for soft delete
   * Kept for backward compatibility, but now calls deactivate()
   */
  async remove(id: number): Promise<void> {
    // Redirect to deactivate for soft delete
    await this.deactivate(id, false);
  }
}
