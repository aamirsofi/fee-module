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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreateSchoolDto } from '../schools/dto/create-school.dto';
import { UpdateSchoolDto } from '../schools/dto/update-school.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@ApiTags('Super Admin')
@ApiBearerAuth('JWT-auth')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // ========== SCHOOL MANAGEMENT ==========
  @Post('schools')
  @ApiOperation({ summary: 'Create a new school (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'School created successfully' })
  createSchool(@Body() createSchoolDto: CreateSchoolDto, @Request() req: any) {
    return this.superAdminService.createSchool(createSchoolDto, req.user.id);
  }

  @Get('schools')
  @ApiOperation({ summary: 'Get all schools (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of schools' })
  getAllSchools() {
    return this.superAdminService.getAllSchools();
  }

  @Get('schools/:id')
  @ApiOperation({ summary: 'Get school by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'School found' })
  getSchool(@Param('id') id: string) {
    return this.superAdminService.getSchool(+id);
  }

  @Patch('schools/:id')
  @ApiOperation({ summary: 'Update school (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'School updated successfully' })
  updateSchool(@Param('id') id: string, @Body() updateSchoolDto: UpdateSchoolDto) {
    return this.superAdminService.updateSchool(+id, updateSchoolDto);
  }

  @Delete('schools/:id')
  @ApiOperation({ summary: 'Delete school (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'School deleted successfully' })
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
  @ApiOperation({ summary: 'Get all users (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  getAllUsers() {
    return this.superAdminService.getAllUsers();
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

