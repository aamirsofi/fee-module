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
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Academic Years')
@ApiBearerAuth('JWT-auth')
@Controller('academic-years')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new academic year' })
  @ApiResponse({ status: 201, description: 'Academic year created successfully' })
  create(@Body() createAcademicYearDto: CreateAcademicYearDto, @Request() req: any) {
    const schoolId = req.school?.id || req.user?.schoolId;

    if (!schoolId) {
      throw new BadRequestException('School context required');
    }

    const numericSchoolId = typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId;
    if (isNaN(numericSchoolId)) {
      throw new BadRequestException(`Invalid school ID: ${schoolId}`);
    }

    return this.academicYearsService.create(createAcademicYearDto, numericSchoolId);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all academic years' })
  @ApiResponse({ status: 200, description: 'List of academic years' })
  findAll(@Request() req: any) {
    const schoolId = req.school?.id || req.user?.schoolId;

    if (!schoolId) {
      throw new BadRequestException('School context required');
    }

    const numericSchoolId = typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId;
    return this.academicYearsService.findAll(numericSchoolId);
  }

  @Get('current')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current academic year' })
  @ApiResponse({ status: 200, description: 'Current academic year' })
  async getCurrent(@Request() req: any) {
    const schoolId = req.school?.id || req.user?.schoolId;

    if (!schoolId) {
      throw new BadRequestException('School context required');
    }

    const numericSchoolId = typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId;
    return await this.academicYearsService.getOrCreateCurrent(numericSchoolId);
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get academic year by ID' })
  @ApiResponse({ status: 200, description: 'Academic year found' })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user?.schoolId;
    const numericSchoolId = schoolId ? (typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId) : undefined;
    return this.academicYearsService.findOne(+id, numericSchoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update academic year' })
  @ApiResponse({ status: 200, description: 'Academic year updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateAcademicYearDto: UpdateAcademicYearDto,
    @Request() req: any,
  ) {
    const schoolId = req.school?.id || req.user?.schoolId;
    const numericSchoolId = schoolId ? (typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId) : undefined;
    return this.academicYearsService.update(+id, updateAcademicYearDto, numericSchoolId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete academic year' })
  @ApiResponse({ status: 200, description: 'Academic year deleted successfully' })
  remove(@Param('id') id: string, @Request() req: any) {
    const schoolId = req.school?.id || req.user?.schoolId;
    const numericSchoolId = schoolId ? (typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId) : undefined;
    return this.academicYearsService.remove(+id, numericSchoolId);
  }
}

