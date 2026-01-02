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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new student' })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'School ID (required for super admin, optional for others)',
  })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  create(
    @Body() createStudentDto: CreateStudentDto,
    @Request() req: any,
    @Query('schoolId') schoolIdParam?: string,
  ) {
    // Get schoolId from query params (for super admin) or from request context
    const userSchoolId = req.school?.id || req.user?.schoolId;
    const schoolIdFromQuery = schoolIdParam ? parseInt(schoolIdParam, 10) : undefined;
    const schoolId = schoolIdFromQuery || userSchoolId;

    // Log for debugging
    console.log('Creating student with schoolId:', schoolId);
    console.log('schoolIdFromQuery:', schoolIdFromQuery);
    console.log('userSchoolId:', userSchoolId);
    console.log('req.school:', req.school);
    console.log('req.user:', req.user);

    // All users including super admin need a school context to create students
    if (!schoolId) {
      throw new BadRequestException(
        'School context required. Please provide schoolId as query parameter for super admin, or ensure you are logged in with a school assigned.',
      );
    }

    // Ensure schoolId is a number
    const numericSchoolId = typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId;
    if (isNaN(numericSchoolId)) {
      throw new BadRequestException(`Invalid school ID: ${schoolId}`);
    }

    return this.studentsService.create(createStudentDto, numericSchoolId);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all students' })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'Filter by school ID (optional for super admin)',
  })
  @ApiResponse({ status: 200, description: 'List of students' })
  findAll(@Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user?.schoolId;
    const targetSchoolId = schoolId ? +schoolId : userSchoolId;

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School context required');
    }

    // For super admin without schoolId, we could return all, but for now require schoolId
    if (!targetSchoolId) {
      throw new BadRequestException('School ID is required. Use ?schoolId=X query parameter for super admin.');
    }

    return this.studentsService.findAll(targetSchoolId);
  }

  @Get('last-id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get last student ID for a school' })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'School ID (optional for super admin)',
  })
  @ApiResponse({ status: 200, description: 'Last student ID' })
  async getLastStudentId(@Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user?.schoolId;
    const targetSchoolId = schoolId ? +schoolId : userSchoolId;

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School context required');
    }

    if (!targetSchoolId) {
      throw new BadRequestException('School ID is required. Use ?schoolId=X query parameter for super admin.');
    }

    const lastId = await this.studentsService.getLastStudentId(targetSchoolId);
    return { lastStudentId: lastId, nextStudentId: lastId ? lastId + 1 : 1 };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiResponse({ status: 200, description: 'Student found' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.studentsService.findOne(+id, schoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update student' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.studentsService.update(+id, updateStudentDto, schoolId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete student' })
  @ApiResponse({ status: 200, description: 'Student deleted successfully' })
  remove(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    return this.studentsService.remove(+id, schoolId);
  }
}

