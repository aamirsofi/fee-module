import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateStudentDto } from '../../students/dto/create-student.dto';

export class BulkImportStudentsDto {
  @ApiProperty({
    type: [CreateStudentDto],
    description: 'Array of students to import',
    example: [
      {
        studentId: 'STU001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        class: '10th Grade',
        section: 'A',
        status: 'active',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one student is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateStudentDto)
  students!: CreateStudentDto[];
}
