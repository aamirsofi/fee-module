import { PartialType } from '@nestjs/swagger';
import { CreateFeeStructureDto } from './create-fee-structure.dto';

export class UpdateFeeStructureDto extends PartialType(CreateFeeStructureDto) {}
