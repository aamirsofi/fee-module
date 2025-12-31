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
import { StudentAcademicRecordsService } from './student-academic-records.service';
import { CreateStudentAcademicRecordDto } from './dto/create-student-academic-record.dto';
import { UpdateStudentAcademicRecordDto } from './dto/update-student-academic-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Student Academic Records')
@ApiBearerAuth('JWT-auth')
@Controller('student-academic-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentAcademicRecordsController {
  constructor(
    private readonly studentAcademicRecordsService: StudentAcademicRecordsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new student academic record' })
  @ApiResponse({ status: 201, description: 'Student academic record created successfully' })
  create(@Body() createDto: CreateStudentAcademicRecordDto) {
    return this.studentAcademicRecordsService.create(createDto);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all student academic records' })
  @ApiResponse({ status: 200, description: 'List of student academic records' })
  findAll(@Request() req: any) {
    const studentId = req.query.studentId ? +req.query.studentId : undefined;
    const academicYearId = req.query.academicYearId ? +req.query.academicYearId : undefined;
    return this.studentAcademicRecordsService.findAll(studentId, academicYearId);
  }

  @Get('student/:studentId/current')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current academic record for a student' })
  @ApiResponse({ status: 200, description: 'Current academic record found' })
  getCurrent(@Param('studentId') studentId: string) {
    return this.studentAcademicRecordsService.findCurrent(+studentId);
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student academic record by ID' })
  @ApiResponse({ status: 200, description: 'Student academic record found' })
  @ApiResponse({ status: 404, description: 'Student academic record not found' })
  findOne(@Param('id') id: string) {
    return this.studentAcademicRecordsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update student academic record' })
  @ApiResponse({ status: 200, description: 'Student academic record updated successfully' })
  update(@Param('id') id: string, @Body() updateDto: UpdateStudentAcademicRecordDto) {
    return this.studentAcademicRecordsService.update(+id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete student academic record' })
  @ApiResponse({ status: 200, description: 'Student academic record deleted successfully' })
  remove(@Param('id') id: string) {
    return this.studentAcademicRecordsService.remove(+id);
  }

  @Post('promote')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Promote student to next academic year' })
  @ApiResponse({ status: 201, description: 'Student promoted successfully' })
  promote(
    @Body()
    body: {
      studentId: number;
      currentAcademicYearId: number;
      nextAcademicYearId: number;
      nextClassId: number;
      section?: string;
    },
  ) {
    return this.studentAcademicRecordsService.promoteStudent(
      body.studentId,
      body.currentAcademicYearId,
      body.nextAcademicYearId,
      body.nextClassId,
      body.section,
    );
  }
}

