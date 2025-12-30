import { PartialType } from '@nestjs/swagger';
import { CreateCategoryHeadDto } from './create-category-head.dto';

export class UpdateCategoryHeadDto extends PartialType(CreateCategoryHeadDto) {}
