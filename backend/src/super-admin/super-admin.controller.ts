import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiExtraModels,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreateSchoolDto } from '../schools/dto/create-school.dto';
import { UpdateSchoolDto } from '../schools/dto/update-school.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { PaginatedSchoolResponseDto } from './dto/paginated-school-response.dto';
import { School } from '../schools/entities/school.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { BulkImportStudentsDto } from './dto/bulk-import-students.dto';
import { CreateFeeCategoryDto } from '../fee-categories/dto/create-fee-category.dto';
import { UpdateFeeCategoryDto } from '../fee-categories/dto/update-fee-category.dto';
import { CreateCategoryHeadDto } from '../category-heads/dto/create-category-head.dto';
import { UpdateCategoryHeadDto } from '../category-heads/dto/update-category-head.dto';
import { CategoryHeadsService } from '../category-heads/category-heads.service';
import { FeeCategoryType } from '../fee-categories/entities/fee-category.entity';
import { CreateFeeStructureDto } from '../fee-structures/dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from '../fee-structures/dto/update-fee-structure.dto';

@ApiTags('Super Admin')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(
  PaginationDto,
  BulkImportStudentsDto,
  CreateFeeCategoryDto,
  UpdateFeeCategoryDto,
  CreateCategoryHeadDto,
  UpdateCategoryHeadDto,
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
)
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly categoryHeadsService: CategoryHeadsService,
  ) {}

  // ========== SCHOOL MANAGEMENT ==========
  @Post('schools')
  @ApiOperation({ summary: 'Create a new school (Super Admin only)' })
  @ApiOkResponse({ type: School, description: 'School created successfully', status: 201 })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  createSchool(@Body() createSchoolDto: CreateSchoolDto, @Request() req: any) {
    return this.superAdminService.createSchool(createSchoolDto, req.user.id);
  }

  @Get('schools')
  @ApiOperation({ summary: 'Get all schools with pagination (Super Admin only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1, minimum: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, minimum: 1, maximum: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status (active, inactive, suspended)',
    example: 'active',
  })
  @ApiOkResponse({
    type: PaginatedSchoolResponseDto,
    description: 'Paginated list of schools',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'ABC School',
            subdomain: 'abc-school',
            email: 'info@abcschool.com',
            phone: '+1234567890',
            address: '123 Main St',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
          hasNextPage: true,
          hasPrevPage: false,
        },
      },
    },
  })
  getAllSchools(@Query() paginationDto: PaginationDto) {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const status = paginationDto.status;

    return this.superAdminService.getAllSchools(page, limit, status);
  }

  @Get('schools/:id')
  @ApiOperation({ summary: 'Get school by ID (Super Admin only)' })
  @ApiOkResponse({ type: School, description: 'School found' })
  @ApiResponse({ status: 404, description: 'School not found' })
  getSchool(@Param('id') id: string) {
    return this.superAdminService.getSchool(+id);
  }

  @Get('schools/:id/details')
  @ApiOperation({
    summary: 'Get comprehensive school details with all related data (Super Admin only)',
  })
  @ApiOkResponse({
    description: 'School details with students, users, payments, and fee structures',
    schema: {
      example: {
        school: {
          id: 1,
          name: 'ABC School',
          subdomain: 'abc-school',
          email: 'info@abcschool.com',
          status: 'active',
        },
        students: [],
        users: [],
        payments: [],
        feeStructures: [],
        stats: {
          totalStudents: 0,
          activeStudents: 0,
          totalUsers: 0,
          totalPayments: 0,
          completedPayments: 0,
          totalRevenue: 0,
          totalFeeStructures: 0,
          activeFeeStructures: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'School not found' })
  getSchoolDetails(@Param('id') id: string) {
    return this.superAdminService.getSchoolDetails(+id);
  }

  @Get('schools/:id/classes')
  @ApiOperation({ summary: 'Get unique classes for a school (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'School ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of unique classes',
    schema: { type: 'array', items: { type: 'string' } },
  })
  @ApiResponse({ status: 404, description: 'School not found' })
  getSchoolClasses(@Param('id') id: string) {
    return this.superAdminService.getSchoolClasses(+id);
  }

  @Patch('schools/:id')
  @ApiOperation({ summary: 'Update school (Super Admin only)' })
  @ApiOkResponse({ type: School, description: 'School updated successfully' })
  @ApiResponse({ status: 404, description: 'School not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  updateSchool(@Param('id') id: string, @Body() updateSchoolDto: UpdateSchoolDto) {
    return this.superAdminService.updateSchool(+id, updateSchoolDto);
  }

  @Delete('schools/:id')
  @ApiOperation({ summary: 'Delete school (Super Admin only)' })
  @ApiOkResponse({ type: School, description: 'School deleted successfully' })
  @ApiResponse({ status: 404, description: 'School not found' })
  deleteSchool(@Param('id') id: string) {
    return this.superAdminService.deleteSchool(+id);
  }

  @Post('schools/:id/students/bulk-import')
  @ApiOperation({
    summary: 'Bulk import students for a school (Super Admin only)',
    description:
      'Import multiple students at once for a specific school. Returns success/failure counts and detailed errors.',
  })
  @ApiOkResponse({
    description: 'Bulk import completed',
    schema: {
      example: {
        success: 5,
        failed: 2,
        errors: [
          {
            row: 3,
            studentId: 'STU003',
            email: 'duplicate@example.com',
            error: 'Email already exists for this school',
          },
        ],
        created: [
          {
            studentId: 'STU001',
            email: 'john.doe@example.com',
            name: 'John Doe',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'School not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  bulkImportStudents(@Param('id') id: string, @Body() bulkImportDto: BulkImportStudentsDto) {
    return this.superAdminService.bulkImportStudents(+id, bulkImportDto);
  }

  // ========== USER MANAGEMENT ==========
  @Post('users')
  @ApiOperation({ summary: 'Create a new user (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.superAdminService.createUser(createUserDto);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination and search (Super Admin only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1, minimum: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, minimum: 1, maximum: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query to filter by name or email',
    example: 'john',
  })
  @ApiOkResponse({
    description: 'Paginated list of users',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'administrator',
            schoolId: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
          hasNextPage: true,
          hasPrevPage: false,
        },
      },
    },
  })
  getAllUsers(@Query() paginationDto: PaginationDto) {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const search = paginationDto.search;

    return this.superAdminService.getAllUsers(page, limit, search);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User found' })
  getUser(@Param('id') id: string) {
    return this.superAdminService.getUser(+id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.superAdminService.updateUser(+id, updateUserDto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  deleteUser(@Param('id') id: string) {
    return this.superAdminService.deleteUser(+id);
  }

  // ========== FEE CATEGORIES MANAGEMENT ==========
  @Get('fee-categories')
  @ApiOperation({
    summary: 'Get all fee categories with pagination and search (Super Admin only)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1, minimum: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, minimum: 1, maximum: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query to filter by name or description',
    example: 'tuition',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'Filter by school ID',
    example: 1,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['school', 'transport'],
    description: 'Filter by fee type (school or transport)',
    example: 'school',
  })
  @ApiOkResponse({
    description: 'Paginated list of fee categories',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Tuition Fee',
            description: 'Regular tuition fees',
            status: 'active',
            schoolId: 1,
            school: { id: 1, name: 'Example School' },
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          total: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    },
  })
  getAllFeeCategories(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: FeeCategoryType,
  ) {
    return this.superAdminService.getAllFeeCategories(
      page ? +page : 1,
      limit ? +limit : 10,
      search,
      schoolId ? +schoolId : undefined,
      type,
    );
  }

  @Get('fee-categories/:id')
  @ApiOperation({ summary: 'Get fee category by ID (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Fee category ID' })
  @ApiResponse({ status: 200, description: 'Fee category found' })
  @ApiResponse({ status: 404, description: 'Fee category not found' })
  getFeeCategoryById(@Param('id') id: string) {
    return this.superAdminService.getFeeCategoryById(+id);
  }

  @Post('fee-categories')
  @ApiOperation({ summary: 'Create a new fee category (Super Admin only)' })
  @ApiQuery({ name: 'schoolId', required: true, type: Number, description: 'School ID' })
  @ApiBody({ type: CreateFeeCategoryDto })
  @ApiResponse({ status: 201, description: 'Fee category created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'School not found' })
  createFeeCategory(
    @Body() createFeeCategoryDto: CreateFeeCategoryDto,
    @Query('schoolId') schoolId: string,
  ) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.superAdminService.createFeeCategory(createFeeCategoryDto, +schoolId);
  }

  @Patch('fee-categories/:id')
  @ApiOperation({ summary: 'Update fee category (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Fee category ID', type: Number })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'Filter by school ID (optional)',
  })
  @ApiBody({ type: UpdateFeeCategoryDto })
  @ApiResponse({ status: 200, description: 'Fee category updated successfully' })
  @ApiResponse({ status: 404, description: 'Fee category not found' })
  updateFeeCategory(
    @Param('id') id: string,
    @Body() updateFeeCategoryDto: UpdateFeeCategoryDto,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.superAdminService.updateFeeCategory(
      +id,
      updateFeeCategoryDto,
      schoolId ? +schoolId : undefined,
    );
  }

  @Delete('fee-categories/:id')
  @ApiOperation({ summary: 'Delete fee category (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Fee category ID', type: Number })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'Filter by school ID (optional)',
  })
  @ApiResponse({ status: 200, description: 'Fee category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fee category not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - fee category has associated fee structures',
  })
  deleteFeeCategory(@Param('id') id: string, @Query('schoolId') schoolId?: string) {
    return this.superAdminService.deleteFeeCategory(+id, schoolId ? +schoolId : undefined);
  }

  // ========== DASHBOARD & STATS ==========
  @Get('dashboard')
  @ApiOperation({ summary: 'Get super admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  getDashboardStats() {
    return this.superAdminService.getDashboardStats();
  }

  // ========== CATEGORY HEADS MANAGEMENT ==========
  @Get('category-heads')
  @ApiOperation({
    summary: 'Get all category heads with pagination and search (Super Admin only)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1, minimum: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, minimum: 1, maximum: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query to filter by name or description',
    example: 'general',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'Filter by school ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Paginated list of category heads',
  })
  getAllCategoryHeads(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.categoryHeadsService.findAll(
      page ? +page : 1,
      limit ? +limit : 10,
      search,
      schoolId ? +schoolId : undefined,
    );
  }

  @Get('category-heads/:id')
  @ApiOperation({ summary: 'Get category head by ID (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Category head ID' })
  @ApiResponse({ status: 200, description: 'Category head found' })
  @ApiResponse({ status: 404, description: 'Category head not found' })
  getCategoryHeadById(@Param('id') id: string, @Query('schoolId') schoolId?: string) {
    return this.categoryHeadsService.findOne(+id, schoolId ? +schoolId : undefined);
  }

  @Post('category-heads')
  @ApiOperation({ summary: 'Create a new category head (Super Admin only)' })
  @ApiBody({ type: CreateCategoryHeadDto })
  @ApiResponse({ status: 201, description: 'Category head created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'School not found' })
  createCategoryHead(
    @Body() createCategoryHeadDto: CreateCategoryHeadDto,
    @Query('schoolId') schoolId: string,
  ) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.categoryHeadsService.create(createCategoryHeadDto, +schoolId);
  }

  @Patch('category-heads/:id')
  @ApiOperation({ summary: 'Update category head (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Category head ID' })
  @ApiBody({ type: UpdateCategoryHeadDto })
  @ApiResponse({ status: 200, description: 'Category head updated successfully' })
  @ApiResponse({ status: 404, description: 'Category head not found' })
  updateCategoryHead(
    @Param('id') id: string,
    @Body() updateCategoryHeadDto: UpdateCategoryHeadDto,
    @Query('schoolId') schoolId: string,
  ) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.categoryHeadsService.update(+id, updateCategoryHeadDto, +schoolId);
  }

  @Delete('category-heads/:id')
  @ApiOperation({ summary: 'Delete category head (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Category head ID' })
  @ApiResponse({ status: 200, description: 'Category head deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category head not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete - category head is in use' })
  removeCategoryHead(@Param('id') id: string, @Query('schoolId') schoolId: string) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.categoryHeadsService.remove(+id, +schoolId);
  }

  // ========== FEE STRUCTURES (FEE PLANS) MANAGEMENT ==========
  @Get('fee-structures')
  @ApiOperation({ summary: 'Get all fee structures/plans with pagination (Super Admin only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1, minimum: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, minimum: 1, maximum: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or description',
    example: 'tuition',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'Filter by school ID',
    example: 1,
  })
  @ApiQuery({
    name: 'feeCategoryId',
    required: false,
    type: Number,
    description: 'Filter by fee category ID',
    example: 1,
  })
  @ApiQuery({
    name: 'categoryHeadId',
    required: false,
    type: Number,
    description: 'Filter by category head ID',
    example: 1,
  })
  @ApiQuery({
    name: 'academicYear',
    required: false,
    type: String,
    description: 'Filter by academic year',
    example: '2024-2025',
  })
  @ApiOkResponse({
    description: 'Paginated list of fee structures',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Tuition Fee Plan - Grade 1',
            description: 'Monthly tuition fee',
            amount: 5000,
            class: 'Grade 1',
            academicYear: '2024-2025',
            dueDate: '2024-12-31',
            status: 'active',
            schoolId: 1,
            feeCategoryId: 1,
            categoryHeadId: 1,
            school: { id: 1, name: 'Example School' },
            category: { id: 1, name: 'Tuition Fee' },
            categoryHead: { id: 1, name: 'General' },
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          total: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    },
  })
  getAllFeeStructures(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
    @Query('feeCategoryId') feeCategoryId?: string,
    @Query('categoryHeadId') categoryHeadId?: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.superAdminService.getAllFeeStructures(
      page ? +page : 1,
      limit ? +limit : 10,
      search,
      schoolId ? +schoolId : undefined,
      feeCategoryId ? +feeCategoryId : undefined,
      categoryHeadId ? +categoryHeadId : undefined,
      academicYear,
    );
  }

  @Get('fee-structures/:id')
  @ApiOperation({ summary: 'Get fee structure by ID (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Fee structure ID', type: Number })
  @ApiOkResponse({ description: 'Fee structure found' })
  @ApiResponse({ status: 404, description: 'Fee structure not found' })
  getFeeStructureById(@Param('id') id: string) {
    return this.superAdminService.getFeeStructureById(+id);
  }

  @Post('fee-structures')
  @ApiOperation({ summary: 'Create a new fee structure/plan (Super Admin only)' })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: Number,
    description: 'School ID',
    example: 1,
  })
  @ApiBody({ type: CreateFeeStructureDto })
  @ApiOkResponse({ description: 'Fee structure created successfully', status: 201 })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'School or fee category not found' })
  createFeeStructure(
    @Body() createFeeStructureDto: CreateFeeStructureDto,
    @Query('schoolId') schoolId: string,
  ) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.superAdminService.createFeeStructure(createFeeStructureDto, +schoolId);
  }

  @Patch('fee-structures/:id')
  @ApiOperation({ summary: 'Update fee structure/plan (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Fee structure ID', type: Number })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: Number,
    description: 'School ID',
    example: 1,
  })
  @ApiBody({ type: UpdateFeeStructureDto })
  @ApiOkResponse({ description: 'Fee structure updated successfully' })
  @ApiResponse({ status: 404, description: 'Fee structure not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  updateFeeStructure(
    @Param('id') id: string,
    @Body() updateFeeStructureDto: UpdateFeeStructureDto,
    @Query('schoolId') schoolId: string,
  ) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.superAdminService.updateFeeStructure(+id, updateFeeStructureDto, +schoolId);
  }

  @Delete('fee-structures/:id')
  @ApiOperation({ summary: 'Delete fee structure/plan (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Fee structure ID', type: Number })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: Number,
    description: 'School ID',
    example: 1,
  })
  @ApiOkResponse({ description: 'Fee structure deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fee structure not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete - fee structure is in use' })
  removeFeeStructure(@Param('id') id: string, @Query('schoolId') schoolId: string) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.superAdminService.removeFeeStructure(+id, +schoolId);
  }
}
