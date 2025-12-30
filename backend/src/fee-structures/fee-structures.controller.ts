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
import { FeeStructuresService } from './fee-structures.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { FeeStructure } from './entities/fee-structure.entity';

@ApiTags('Fee Structures')
@ApiBearerAuth('JWT-auth')
@Controller('fee-structures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeStructuresController {
  constructor(private readonly feeStructuresService: FeeStructuresService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new fee structure' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'School ID (optional for super admin)' })
  @ApiOkResponse({ type: FeeStructure, description: 'Fee structure created successfully', status: 201 })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  create(@Body() createFeeStructureDto: CreateFeeStructureDto, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : userSchoolId;
    
    if (!targetSchoolId && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('School context required');
    }
    return this.feeStructuresService.create(createFeeStructureDto, targetSchoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fee structures' })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({
    type: [FeeStructure],
    description: 'List of fee structures',
    schema: {
      example: [
        {
          id: 1,
          name: 'Tuition Fee Plan - Grade 1',
          description: 'Monthly tuition fee',
          amount: 5000,
          class: 'Grade 1',
          academicYear: '2024-2025',
          dueDate: '2024-12-31',
          status: 'active',
          schoolId: 1,
          feeCategoryId: 1,
          categoryHeadId: 1,
          school: { id: 1, name: 'Example School' },
          category: { id: 1, name: 'Tuition Fee' },
          categoryHead: { id: 1, name: 'General' },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  findAll(@Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);
    return this.feeStructuresService.findAll(targetSchoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fee structure by ID' })
  @ApiParam({ name: 'id', description: 'Fee structure ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ type: FeeStructure, description: 'Fee structure found' })
  @ApiResponse({ status: 404, description: 'Fee structure not found' })
  findOne(@Param('id') id: string, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);
    return this.feeStructuresService.findOne(+id, targetSchoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update fee structure' })
  @ApiParam({ name: 'id', description: 'Fee structure ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ type: FeeStructure, description: 'Fee structure updated successfully' })
  @ApiResponse({ status: 404, description: 'Fee structure not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  update(@Param('id') id: string, @Body() updateFeeStructureDto: UpdateFeeStructureDto, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);
    return this.feeStructuresService.update(+id, updateFeeStructureDto, targetSchoolId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete fee structure' })
  @ApiParam({ name: 'id', description: 'Fee structure ID', type: Number })
  @ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID (optional for super admin)' })
  @ApiOkResponse({ description: 'Fee structure deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fee structure not found' })
  @ApiResponse({ status: 400, description: 'Bad request - fee structure is in use' })
  remove(@Param('id') id: string, @Request() req: any, @Query('schoolId') schoolId?: string) {
    const userSchoolId = req.school?.id || req.user.schoolId;
    const targetSchoolId = schoolId ? +schoolId : (req.user.role === UserRole.SUPER_ADMIN ? undefined : userSchoolId);
    return this.feeStructuresService.remove(+id, targetSchoolId);
  }
}

