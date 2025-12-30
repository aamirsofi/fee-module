import { PartialType } from '@nestjs/swagger';
import { CreateFeeCategoryDto } from './create-fee-category.dto';

export class UpdateFeeCategoryDto extends PartialType(CreateFeeCategoryDto) {}
