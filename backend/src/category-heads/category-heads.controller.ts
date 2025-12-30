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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiOkResponse, ApiExtraModels, ApiParam } from '@nestjs/swagger';
import { CategoryHeadsService } from './category-heads.service';
import { CreateCategoryHeadDto } from './dto/create-category-head.dto';
import { UpdateCategoryHeadDto } from './dto/update-category-head.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Category Heads')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(PaginationDto)
@Controller('category-heads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryHeadsController {
  constructor(private readonly categoryHeadsService: CategoryHeadsService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new category head' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'School ID (optional for super admin)' })
  @ApiOkResponse({ description: 'Category head created successfully', status: 201 })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  create(@Body() createCategoryHeadDto: CreateCategoryHeadDto, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : userSchoolId;

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School ID is required');
    }

    if (req.user.role !== UserRole.SUPER_ADMIN && targetSchoolId !== userSchoolId) {
      throw new BadRequestException('You can only create category heads for your own school');
    }

    return this.categoryHeadsService.create(createCategoryHeadDto, targetSchoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all category heads with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or description' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID' })
  @ApiOkResponse({ description: 'Paginated list of category heads' })
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);

    return this.categoryHeadsService.findAll(
      page ? +page : 1,
      limit ? +limit : 10,
      search,
      targetSchoolId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category head by ID' })
  @ApiParam({ name: 'id', description: 'Category head ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ description: 'Category head found' })
  @ApiResponse({ status: 404, description: 'Category head not found' })
  findOne(@Param('id') id: string, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);

    return this.categoryHeadsService.findOne(+id, targetSchoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update category head' })
  @ApiParam({ name: 'id', description: 'Category head ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ description: 'Category head updated successfully' })
  @ApiResponse({ status: 404, description: 'Category head not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryHeadDto: UpdateCategoryHeadDto,
    @Request() req: any,
    @Query('schoolId') schoolId?: string,
  ) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School ID is required');
    }

    return this.categoryHeadsService.update(+id, updateCategoryHeadDto, targetSchoolId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete category head' })
  @ApiParam({ name: 'id', description: 'Category head ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ description: 'Category head deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category head not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete - category head is in use' })
  remove(@Param('id') id: string, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School ID is required');
    }

    return this.categoryHeadsService.remove(+id, targetSchoolId);
  }
}

