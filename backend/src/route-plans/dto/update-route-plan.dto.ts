import { PartialType } from '@nestjs/swagger';
import { CreateRoutePlanDto } from './create-route-plan.dto';

export class UpdateRoutePlanDto extends PartialType(CreateRoutePlanDto) {}

