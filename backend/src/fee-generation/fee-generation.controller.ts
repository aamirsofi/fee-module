import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FeeGenerationService } from './fee-generation.service';
import { GenerateFeesDto } from './dto/generate-fees.dto';
import { ForecastFeesDto } from './dto/forecast-fees.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Fee Generation')
@Controller('fee-generation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FeeGenerationController {
  constructor(private readonly feeGenerationService: FeeGenerationService) {}

  @Post('generate')
  @Roles('super_admin', 'administrator')
  @ApiOperation({ summary: 'Generate fees for students' })
  @ApiResponse({ status: 201, description: 'Fees generated successfully' })
  async generateFees(
    @Body() generateDto: GenerateFeesDto,
    @Request() req: any,
  ) {
    // Get schoolId from request context, user, or DTO (for super_admin)
    const schoolId = req.school?.id || req.user.schoolId || generateDto.schoolId;
    
    if (!schoolId) {
      throw new BadRequestException('School ID is required. Please provide schoolId in the request body or ensure school context is set.');
    }

    const userId = req.user.sub;
    const userName = req.user.email;

    return await this.feeGenerationService.generateFees(
      generateDto,
      schoolId,
      userId,
      userName,
    );
  }

  @Get('history')
  @Roles('super_admin', 'administrator')
  @ApiOperation({ summary: 'Get fee generation history' })
  @ApiResponse({ status: 200, description: 'Generation history retrieved successfully' })
  async getGenerationHistory(
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
    @Query('schoolId', new ParseIntPipe({ optional: true })) schoolIdParam?: number,
  ) {
    // Get schoolId from query param, request context, or user
    const schoolId = schoolIdParam || req.school?.id || req.user.schoolId;
    
    if (!schoolId) {
      throw new BadRequestException('School ID is required. Please provide schoolId as a query parameter or ensure school context is set.');
    }
    
    return await this.feeGenerationService.getGenerationHistory(schoolId, limit);
  }

  @Get('history/:id')
  @Roles('super_admin', 'administrator')
  @ApiOperation({ summary: 'Get detailed fee generation history by ID' })
  @ApiResponse({ status: 200, description: 'Generation history details retrieved successfully' })
  async getGenerationHistoryDetails(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Query('schoolId', new ParseIntPipe({ optional: true })) schoolIdParam?: number,
  ) {
    // Get schoolId from query param, request context, or user
    const schoolId = schoolIdParam || req.school?.id || req.user.schoolId;
    
    if (!schoolId) {
      throw new BadRequestException('School ID is required. Please provide schoolId as a query parameter or ensure school context is set.');
    }
    
    return await this.feeGenerationService.getGenerationHistoryDetails(id, schoolId);
  }

  @Post('forecast')
  @Roles('super_admin', 'administrator')
  @ApiOperation({ summary: 'Forecast fees for a student up to a specific date' })
  @ApiResponse({ status: 200, description: 'Fee forecast retrieved successfully' })
  async forecastFees(
    @Body() forecastDto: ForecastFeesDto,
    @Request() req: any,
  ) {
    // Get schoolId from request context, user, or DTO (for super_admin)
    const schoolId = req.school?.id || req.user.schoolId || forecastDto.schoolId;
    
    if (!schoolId) {
      throw new BadRequestException('School ID is required. Please provide schoolId in the request body or ensure school context is set.');
    }
    
    return await this.feeGenerationService.forecastFees(forecastDto, schoolId);
  }
}

