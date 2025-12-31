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
  ApiExtraModels,
  ApiParam,
} from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Routes')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(PaginationDto)
@Controller('super-admin/routes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new route' })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: Number,
    description: 'School ID',
  })
  @ApiOkResponse({ description: 'Route created successfully', status: 201 })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  create(
    @Body() createRouteDto: CreateRouteDto,
    @Request() req: any,
    @Query('schoolId') schoolId?: string,
  ) {
    if (!schoolId) {
      throw new BadRequestException('School ID is required');
    }

    return this.routesService.create(createRouteDto, +schoolId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all routes with pagination and search' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or description',
  })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID' })
  @ApiOkResponse({ description: 'Paginated list of routes' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.routesService.findAll(
      page ? +page : 1,
      limit ? +limit : 10,
      search,
      schoolId ? +schoolId : undefined,
    );
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get route by ID' })
  @ApiParam({ name: 'id', description: 'Route ID', type: Number })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: Number,
    description: 'Filter by school ID',
  })
  @ApiOkResponse({ description: 'Route found' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  findOne(@Param('id') id: string, @Query('schoolId') schoolId?: string) {
    return this.routesService.findOne(+id, schoolId ? +schoolId : undefined);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update route' })
  @ApiParam({ name: 'id', description: 'Route ID', type: Number })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: Number,
    description: 'School ID',
  })
  @ApiOkResponse({ description: 'Route updated successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  update(
    @Param('id') id: string,
    @Body() updateRouteDto: UpdateRouteDto,
    @Query('schoolId') schoolId?: string,
  ) {
    if (!schoolId) {
      throw new BadRequestException('School ID is required');
    }

    return this.routesService.update(+id, updateRouteDto, +schoolId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete route' })
  @ApiParam({ name: 'id', description: 'Route ID', type: Number })
  @ApiQuery({
    name: 'schoolId',
    required: true,
    type: Number,
    description: 'School ID',
  })
  @ApiOkResponse({ description: 'Route deleted successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete - route is in use' })
  remove(@Param('id') id: string, @Query('schoolId') schoolId?: string) {
    if (!schoolId) {
      throw new BadRequestException('School ID is required');
    }

    return this.routesService.remove(+id, +schoolId);
  }
}

