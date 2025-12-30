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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FeeCategoriesService } from './fee-categories.service';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import { UpdateFeeCategoryDto } from './dto/update-fee-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { FeeCategory } from './entities/fee-category.entity';

@ApiTags('Fee Categories')
@ApiBearerAuth('JWT-auth')
@Controller('fee-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeCategoriesController {
  constructor(private readonly feeCategoriesService: FeeCategoriesService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new fee category' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'School ID (optional for super admin)' })
  @ApiOkResponse({ type: FeeCategory, description: 'Fee category created successfully', status: 201 })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  create(@Body() createFeeCategoryDto: CreateFeeCategoryDto, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : userSchoolId;
    
    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('School context required');
    }
    return this.feeCategoriesService.create(createFeeCategoryDto, targetSchoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fee categories' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ type: [FeeCategory], description: 'List of fee categories' })
  findAll(@Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);
    return this.feeCategoriesService.findAll(targetSchoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fee category by ID' })
  @ApiParam({ name: 'id', description: 'Fee category ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ type: FeeCategory, description: 'Fee category found' })
  @ApiResponse({ status: 404, description: 'Fee category not found' })
  findOne(@Param('id') id: string, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);
    return this.feeCategoriesService.findOne(+id, targetSchoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update fee category' })
  @ApiParam({ name: 'id', description: 'Fee category ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ type: FeeCategory, description: 'Fee category updated successfully' })
  @ApiResponse({ status: 404, description: 'Fee category not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  update(@Param('id') id: string, @Body() updateFeeCategoryDto: UpdateFeeCategoryDto, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);
    return this.feeCategoriesService.update(+id, updateFeeCategoryDto, targetSchoolId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete fee category' })
  @ApiParam({ name: 'id', description: 'Fee category ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ description: 'Fee category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fee category not found' })
  remove(@Param('id') id: string, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);
    return this.feeCategoriesService.remove(+id, targetSchoolId);
  }
}

