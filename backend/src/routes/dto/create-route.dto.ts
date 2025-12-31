import { IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RouteStatus } from '../entities/route.entity';

export class CreateRouteDto {
  @ApiProperty({ example: 'Route A' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ required: false, example: 'Main route covering downtown area' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: RouteStatus, required: false })
  @IsEnum(RouteStatus)
  @IsOptional()
  status?: RouteStatus;
}

