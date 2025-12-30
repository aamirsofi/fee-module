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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  create(@Body() createStudentDto: CreateStudentDto, @Request() req: any) {
    const schoolId = req.school?.id || req.user?.schoolId;

    // Log for debugging
    console.log('Creating student with schoolId:', schoolId);
    console.log('req.school:', req.school);
    console.log('req.user:', req.user);

    // All users including super admin need a school context to create students
    if (!schoolId) {
      throw new BadRequestException(
        'School context required. Please create a school first or access via school subdomain.',
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
  @ApiResponse({ status: 200, description: 'List of students' })
  findAll(@Request() req: any) {
    const schoolId = req.school?.id || req.user.schoolId;
    // Super admin can access all students, others need school context
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return this.studentsService.findAll(schoolId); // schoolId can be undefined for super admin
    }
    if (!schoolId) {
      throw new BadRequestException('School context required');
    }
    return this.studentsService.findAll(schoolId);
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
