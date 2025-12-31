import { PartialType } from '@nestjs/swagger';
import { CreateStudentAcademicRecordDto } from './create-student-academic-record.dto';

export class UpdateStudentAcademicRecordDto extends PartialType(CreateStudentAcademicRecordDto) {}

