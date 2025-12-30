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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiOkResponse, ApiExtraModels } from '@nestjs/swagger';
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

@ApiTags('Super Admin')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(PaginationDto)
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

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
    example: 1 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Items per page (default: 10, minimum: 1, maximum: 100)', 
    example: 10 
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    type: String, 
    description: 'Filter by status (active, inactive, suspended)', 
    example: 'active' 
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
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
          hasNextPage: true,
          hasPrevPage: false
        }
      }
    }
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
  @ApiOperation({ summary: 'Get comprehensive school details with all related data (Super Admin only)' })
  @ApiOkResponse({ 
    description: 'School details with students, users, payments, and fee structures',
    schema: {
      example: {
        school: {
          id: 1,
          name: 'ABC School',
          subdomain: 'abc-school',
          email: 'info@abcschool.com',
          status: 'active'
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
          activeFeeStructures: 0
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'School not found' })
  getSchoolDetails(@Param('id') id: string) {
    return this.superAdminService.getSchoolDetails(+id);
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
    example: 1 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Items per page (default: 10, minimum: 1, maximum: 100)', 
    example: 10 
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    type: String, 
    description: 'Search query to filter by name or email', 
    example: 'john' 
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
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
          hasNextPage: true,
          hasPrevPage: false
        }
      }
    }
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

  // ========== DASHBOARD & STATS ==========
  @Get('dashboard')
  @ApiOperation({ summary: 'Get super admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  getDashboardStats() {
    return this.superAdminService.getDashboardStats();
  }
}

