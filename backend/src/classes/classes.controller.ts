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
  ApiParam,
} from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { Class } from './entities/class.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Classes')
@ApiBearerAuth('JWT-auth')
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new class' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'School ID (optional for super admin)' })
  @ApiOkResponse({ type: Class, description: 'Class created successfully', status: 201 })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  create(@Body() createClassDto: CreateClassDto, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : userSchoolId;

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School ID is required');
    }

    if (req.user.role !== UserRole.SUPER_ADMIN && targetSchoolId !== userSchoolId) {
      throw new BadRequestException('You can only create classes for your own school');
    }

    return this.classesService.create(createClassDto, targetSchoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classes with pagination' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiOkResponse({ description: 'Paginated list of classes' })
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School ID is required');
    }

    return this.classesService.findAll(
      targetSchoolId!,
      page ? +page : 1,
      limit ? +limit : 10,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a class by ID' })
  @ApiParam({ name: 'id', description: 'Class ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ type: Class, description: 'Class found' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  findOne(@Param('id') id: string, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);

    return this.classesService.findOne(+id, targetSchoolId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a class' })
  @ApiParam({ name: 'id', description: 'Class ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ type: Class, description: 'Class updated successfully' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  update(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
    @Request() req: any,
    @Query('schoolId') schoolId?: string,
  ) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School ID is required');
    }

    return this.classesService.update(+id, updateClassDto, targetSchoolId!);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a class' })
  @ApiParam({ name: 'id', description: 'Class ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ description: 'Class deleted successfully' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot delete class with students' })
  remove(@Param('id') id: string, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);

    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('School ID is required');
    }

    return this.classesService.remove(+id, targetSchoolId!);
  }
}

