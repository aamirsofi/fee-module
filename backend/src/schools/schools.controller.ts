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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Schools')
@ApiBearerAuth('JWT-auth')
@Controller('super-admin/schools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new school' })
  @ApiResponse({ status: 201, description: 'School created successfully' })
  create(@Body() createSchoolDto: CreateSchoolDto, @Request() req: any) {
    return this.schoolsService.create(createSchoolDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all schools',
    description:
      'Returns paginated list of schools. By default, only active schools are returned. Use includeInactive=true to include inactive and suspended schools. Use status query param to filter by specific status.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of schools' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const include = includeInactive === 'true';
    return this.schoolsService.findAll(pageNum, limitNum, include, search, status);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get school by ID' })
  @ApiResponse({ status: 200, description: 'School found' })
  @ApiResponse({ status: 404, description: 'School not found' })
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(+id);
  }

  // IMPORTANT: More specific routes must come before generic routes
  // Otherwise, NestJS will match ':id/reactivate' to ':id' route
  @Patch(':id/reactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Reactivate school',
    description:
      'Reactivates an inactive or suspended school by setting its status back to ACTIVE.',
  })
  @ApiResponse({ status: 200, description: 'School reactivated successfully' })
  @ApiResponse({ status: 400, description: 'School is already active' })
  @ApiResponse({ status: 404, description: 'School not found' })
  reactivate(@Param('id') id: string) {
    return this.schoolsService.reactivate(+id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update school' })
  @ApiResponse({ status: 200, description: 'School updated successfully' })
  update(@Param('id') id: string, @Body() updateSchoolDto: UpdateSchoolDto) {
    return this.schoolsService.update(+id, updateSchoolDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Deactivate school (soft delete)',
    description:
      'Deactivates a school by setting its status to INACTIVE. All data is preserved for audit and recovery purposes. Use suspend=true to set status to SUSPENDED instead.',
  })
  @ApiResponse({ status: 200, description: 'School deactivated successfully' })
  @ApiResponse({ status: 400, description: 'School is already inactive/suspended' })
  @ApiResponse({ status: 404, description: 'School not found' })
  deactivate(@Param('id') id: string, @Query('suspend') suspend?: string) {
    const shouldSuspend = suspend === 'true';
    return this.schoolsService.deactivate(+id, shouldSuspend);
  }

  @Delete(':id/hard')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Hard delete school (permanent)',
    description:
      '⚠️ WARNING: Permanently deletes a school and all its related data. This action cannot be undone. By default, prevents deletion if there are payment records (for audit purposes). Use force=true to delete even with payments.',
  })
  @ApiResponse({ status: 200, description: 'School permanently deleted' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete school with payments (unless force=true)',
  })
  @ApiResponse({ status: 404, description: 'School not found' })
  hardDelete(@Param('id') id: string, @Query('force') force?: string) {
    const forceDelete = force === 'true';
    return this.schoolsService.hardDelete(+id, forceDelete);
  }
}
