import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StudentFeeStructure, PaymentStatus } from '../student-fee-structures/entities/student-fee-structure.entity';
import { FeeStructure, StructureStatus } from '../fee-structures/entities/fee-structure.entity';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { StudentAcademicRecord, AcademicRecordStatus } from '../student-academic-records/entities/student-academic-record.entity';
import { AcademicYear } from '../academic-years/entities/academic-year.entity';
import { FeeGenerationHistory, GenerationType, GenerationStatus } from './entities/fee-generation-history.entity';
import { GenerateFeesDto } from './dto/generate-fees.dto';
import { ForecastFeesDto, ForecastResult } from './dto/forecast-fees.dto';
import { School, SchoolStatus } from '../schools/entities/school.entity';
import { RoutePlan, RoutePlanStatus } from '../route-plans/entities/route-plan.entity';
import { addMonths, parseISO, format, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';

@Injectable()
export class FeeGenerationService {
  constructor(
    @InjectRepository(StudentFeeStructure)
    private studentFeeStructureRepository: Repository<StudentFeeStructure>,
    @InjectRepository(FeeStructure)
    private feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(StudentAcademicRecord)
    private academicRecordRepository: Repository<StudentAcademicRecord>,
    @InjectRepository(AcademicYear)
    private academicYearRepository: Repository<AcademicYear>,
    @InjectRepository(FeeGenerationHistory)
    private generationHistoryRepository: Repository<FeeGenerationHistory>,
    @InjectRepository(RoutePlan)
    private routePlanRepository: Repository<RoutePlan>,
  ) {}

  /**
   * Generate fees for students based on fee structures
   */
  async generateFees(
    generateDto: GenerateFeesDto,
    schoolId: number,
    userId?: number,
    userName?: string,
  ): Promise<{ success: boolean; generated: number; failed: number; historyId: number }> {
    // Validate academic year
    const academicYear = await this.academicYearRepository.findOne({
      where: { id: generateDto.academicYearId, schoolId },
    });
    if (!academicYear) {
      throw new NotFoundException(`Academic year with ID ${generateDto.academicYearId} not found`);
    }

    // Validate fee structures
    const feeStructures = await this.feeStructureRepository.find({
      where: {
        id: In(generateDto.feeStructureIds),
        schoolId,
        status: StructureStatus.ACTIVE,
      },
      relations: ['class', 'category'],
    });

    if (feeStructures.length !== generateDto.feeStructureIds.length) {
      throw new NotFoundException('One or more fee structures not found or inactive');
    }

    // Get students based on criteria
    let students: Student[] = [];
    
    if (generateDto.studentIds && generateDto.studentIds.length > 0) {
      // Generate for specific students
      students = await this.studentRepository.find({
        where: {
          id: In(generateDto.studentIds),
          schoolId,
          status: StudentStatus.ACTIVE,
        },
      });
    } else if (generateDto.classIds && generateDto.classIds.length > 0) {
      // Generate for all students in specified classes
      const academicRecords = await this.academicRecordRepository.find({
        where: {
          academicYearId: generateDto.academicYearId,
          classId: In(generateDto.classIds),
          status: AcademicRecordStatus.ACTIVE,
        },
        relations: ['student'],
      });
      students = academicRecords.map(record => record.student).filter(Boolean) as Student[];
    } else {
      throw new BadRequestException('Either studentIds or classIds must be provided');
    }

    if (students.length === 0) {
      throw new BadRequestException('No students found matching the criteria');
    }

    // Prepare data for history
    const classIds = generateDto.classIds || [];
    const studentIds = generateDto.studentIds || students.map(s => s.id);
    const feeStructureIds = generateDto.feeStructureIds;

    // Create generation history record
    const history = this.generationHistoryRepository.create({
      type: GenerationType.MANUAL,
      status: GenerationStatus.IN_PROGRESS,
      schoolId,
      academicYearId: generateDto.academicYearId,
      totalStudents: students.length,
      generatedByUserId: userId,
      generatedBy: userName,
      feeStructureIds: feeStructureIds || feeStructures.map(fs => fs.id),
      classIds: classIds.length > 0 ? classIds : undefined,
      studentIds: studentIds.length > 0 ? studentIds : undefined,
    });
    const savedHistory = await this.generationHistoryRepository.save(history);

    let generated = 0;
    let failed = 0;
    let totalAmountGenerated = 0;
    const errors: string[] = [];
    const failedStudentDetails: Array<{ studentId: number; studentName: string; error: string }> = [];

    try {
      // Process each student
      for (const student of students) {
        try {
          // Get student's academic record for the academic year
          const academicRecord = await this.academicRecordRepository.findOne({
            where: {
              studentId: student.id,
              academicYearId: generateDto.academicYearId,
            },
            relations: ['class'],
          });

          if (!academicRecord || !academicRecord.classId) {
            failed++;
            const errorMsg = `No class assigned`;
            errors.push(`Student ${student.firstName} ${student.lastName}: ${errorMsg}`);
            failedStudentDetails.push({
              studentId: student.id,
              studentName: `${student.firstName} ${student.lastName}`,
              error: errorMsg,
            });
            continue;
          }

          // Process each fee structure
          for (const feeStructure of feeStructures) {
            // Check if fee structure applies to this student's class
            if (feeStructure.classId && feeStructure.classId !== academicRecord.classId) {
              continue; // Skip if fee structure is class-specific and doesn't match
            }

            // Check if fee already exists
            const existingFee = await this.studentFeeStructureRepository.findOne({
              where: {
                studentId: student.id,
                feeStructureId: feeStructure.id,
                academicYearId: generateDto.academicYearId,
              },
            });

            if (existingFee && !generateDto.regenerateExisting) {
              continue; // Skip if fee already exists and not regenerating
            }

            // Calculate amount with discount
            let finalAmount = parseFloat(feeStructure.amount.toString());
            let discountAmount = 0;
            let discountPercentage: number | null = null;

            if (generateDto.discount) {
              if (generateDto.discount.percentage !== undefined) {
                discountPercentage = generateDto.discount.percentage;
                discountAmount = (finalAmount * discountPercentage) / 100;
              } else if (generateDto.discount.fixedAmount !== undefined) {
                discountAmount = generateDto.discount.fixedAmount;
                discountPercentage = (discountAmount / finalAmount) * 100;
              }
              finalAmount = finalAmount - discountAmount;
            }

            const dueDate = parseISO(generateDto.dueDate);

            if (generateDto.installment?.enabled && generateDto.installment.count) {
              // Generate installments
              const installmentCount = generateDto.installment.count;
              const installmentAmount = finalAmount / installmentCount;
              const startDate = generateDto.installment.startDate
                ? parseISO(generateDto.installment.startDate)
                : dueDate;

              for (let i = 0; i < installmentCount; i++) {
                const installmentDueDate = addMonths(startDate, i);
                
                const studentFeeStructure = this.studentFeeStructureRepository.create({
                  studentId: student.id,
                  feeStructureId: feeStructure.id,
                  academicYearId: generateDto.academicYearId,
                  academicRecordId: academicRecord.id,
                  amount: installmentAmount,
                  originalAmount: parseFloat(feeStructure.amount.toString()),
                  discountAmount,
                  discountPercentage: discountPercentage || undefined,
                  dueDate: installmentDueDate,
                  installmentStartDate: startDate,
                  installmentCount: installmentCount,
                  installmentNumber: i + 1,
                  installmentAmount,
                  status: PaymentStatus.PENDING,
                });

                if (existingFee && generateDto.regenerateExisting) {
                  await this.studentFeeStructureRepository.remove(existingFee);
                }

                await this.studentFeeStructureRepository.save(studentFeeStructure);
                generated++;
                totalAmountGenerated += parseFloat(installmentAmount.toString());
              }
            } else {
              // Generate single fee
              const studentFeeStructure = this.studentFeeStructureRepository.create({
                studentId: student.id,
                feeStructureId: feeStructure.id,
                academicYearId: generateDto.academicYearId,
                academicRecordId: academicRecord.id,
                amount: finalAmount,
                originalAmount: parseFloat(feeStructure.amount.toString()),
                discountAmount,
                discountPercentage: discountPercentage || undefined,
                dueDate,
                status: PaymentStatus.PENDING,
              });

              if (existingFee && generateDto.regenerateExisting) {
                await this.studentFeeStructureRepository.remove(existingFee);
              }

              await this.studentFeeStructureRepository.save(studentFeeStructure);
              generated++;
              totalAmountGenerated += finalAmount;
            }
          }
        } catch (error: any) {
          failed++;
          const errorMsg = error.message || 'Unknown error';
          errors.push(`Student ${student.firstName} ${student.lastName}: ${errorMsg}`);
          failedStudentDetails.push({
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            error: errorMsg,
          });
        }
      }

      // Update history record
      savedHistory.status = GenerationStatus.COMPLETED;
      savedHistory.feesGenerated = generated;
      savedHistory.feesFailed = failed;
      savedHistory.totalAmountGenerated = totalAmountGenerated;
      savedHistory.failedStudentDetails = failedStudentDetails.length > 0 ? failedStudentDetails : undefined;
      if (errors.length > 0) {
        savedHistory.errorMessage = errors.slice(0, 5).join('; '); // Store first 5 errors
      }
      await this.generationHistoryRepository.save(savedHistory);

      return {
        success: true,
        generated,
        failed,
        historyId: savedHistory.id,
      };
    } catch (error: any) {
      // Update history record with error
      savedHistory.status = GenerationStatus.FAILED;
      savedHistory.errorMessage = error.message;
      await this.generationHistoryRepository.save(savedHistory);
      throw error;
    }
  }

  /**
   * Automatic monthly fee generation
   */
  async generateMonthlyFees(schoolId: number, academicYearId: number): Promise<void> {
    // Get current academic year
    const academicYear = await this.academicYearRepository.findOne({
      where: { id: academicYearId, schoolId },
    });

    if (!academicYear) {
      throw new NotFoundException(`Academic year with ID ${academicYearId} not found`);
    }

    // Get all active fee structures for the school
    const feeStructures = await this.feeStructureRepository.find({
      where: {
        schoolId,
        status: StructureStatus.ACTIVE,
      },
    });

    if (feeStructures.length === 0) {
      return; // No fee structures to generate
    }

    // Get all active students with academic records
    const academicRecords = await this.academicRecordRepository.find({
      where: {
        academicYearId,
        status: AcademicRecordStatus.ACTIVE,
      },
      relations: ['student', 'class'],
    });

    if (academicRecords.length === 0) {
      return; // No students to generate fees for
    }

    // Create generation history
    const history = this.generationHistoryRepository.create({
      type: GenerationType.AUTOMATIC,
      status: GenerationStatus.IN_PROGRESS,
      schoolId,
      academicYearId,
      totalStudents: academicRecords.length,
      generatedBy: 'System',
    });
    const savedHistory = await this.generationHistoryRepository.save(history);

    let generated = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      const currentDate = new Date();
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); // First day of next month

      for (const record of academicRecords) {
        if (!record.student || !record.class) {
          continue;
        }

        for (const feeStructure of feeStructures) {
          // Check if fee structure applies to this class
          if (feeStructure.classId && feeStructure.classId !== record.classId) {
            continue;
          }

          // Check if fee already exists for this month
          const existingFee = await this.studentFeeStructureRepository.findOne({
            where: {
              studentId: record.studentId,
              feeStructureId: feeStructure.id,
              academicYearId,
            },
          });

          if (existingFee) {
            // Check if this is a monthly installment or if we should create a new one
            if (existingFee.installmentCount && existingFee.installmentNumber) {
              // Check if all installments are generated
              const totalInstallments = await this.studentFeeStructureRepository.count({
                where: {
                  studentId: record.studentId,
                  feeStructureId: feeStructure.id,
                  academicYearId,
                },
              });

              if (totalInstallments >= existingFee.installmentCount) {
                continue; // All installments already generated
              }
            } else {
              continue; // Non-installment fee already exists
            }
          }

          try {
            const finalAmount = parseFloat(feeStructure.amount.toString());

            const studentFeeStructure = this.studentFeeStructureRepository.create({
              studentId: record.studentId,
              feeStructureId: feeStructure.id,
              academicYearId,
              academicRecordId: record.id,
              amount: finalAmount,
              originalAmount: finalAmount,
              discountAmount: 0,
              dueDate,
              status: PaymentStatus.PENDING,
            });

            await this.studentFeeStructureRepository.save(studentFeeStructure);
            generated++;
          } catch (error: any) {
            failed++;
            errors.push(`Student ${record.student.firstName}: ${error.message}`);
          }
        }
      }

      // Update history
      savedHistory.status = GenerationStatus.COMPLETED;
      savedHistory.feesGenerated = generated;
      savedHistory.feesFailed = failed;
      if (errors.length > 0) {
        savedHistory.errorMessage = errors.slice(0, 5).join('; ');
      }
      await this.generationHistoryRepository.save(savedHistory);
    } catch (error: any) {
      savedHistory.status = GenerationStatus.FAILED;
      savedHistory.errorMessage = error.message;
      await this.generationHistoryRepository.save(savedHistory);
      throw error;
    }
  }

  /**
   * Get generation history
   */
  async getGenerationHistory(schoolId: number, limit: number = 50): Promise<FeeGenerationHistory[]> {
    return await this.generationHistoryRepository.find({
      where: { schoolId },
      order: { createdAt: 'desc' },
      take: limit,
      relations: ['school', 'academicYear'],
    });
  }

  async getGenerationHistoryDetails(id: number, schoolId: number): Promise<FeeGenerationHistory> {
    const history = await this.generationHistoryRepository.findOne({
      where: { id, schoolId },
      relations: ['school', 'academicYear'],
    });

    if (!history) {
      throw new NotFoundException(`Generation history with ID ${id} not found`);
    }

    // Load fee structures if IDs are stored
    if (history.feeStructureIds && history.feeStructureIds.length > 0) {
      const feeStructures = await this.feeStructureRepository.find({
        where: { id: In(history.feeStructureIds) },
        relations: ['category', 'class'],
      });
      // Attach fee structures to history object (not saved to DB, just for response)
      (history as any).feeStructures = feeStructures;
    }

    return history;
  }

  /**
   * Forecast fees for a student up to a specific date
   * Includes: class fees, bus fees, previous balance, and other fees
   */
  async forecastFees(
    forecastDto: ForecastFeesDto,
    schoolId: number,
  ): Promise<ForecastResult> {
    // Get student with relations
    const student = await this.studentRepository.findOne({
      where: { id: forecastDto.studentId, schoolId },
      relations: ['routePlan', 'categoryHead'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${forecastDto.studentId} not found`);
    }

    // Get academic year
    const academicYear = await this.academicYearRepository.findOne({
      where: { id: forecastDto.academicYearId, schoolId },
    });

    if (!academicYear) {
      throw new NotFoundException(`Academic year with ID ${forecastDto.academicYearId} not found`);
    }

    // Get academic record
    const academicRecord = await this.academicRecordRepository.findOne({
      where: {
        studentId: student.id,
        academicYearId: forecastDto.academicYearId,
      },
      relations: ['class'],
    });

    if (!academicRecord || !academicRecord.classId) {
      throw new BadRequestException('Student has no class assigned for this academic year');
    }

    // Determine forecast end date
    const forecastEndDate = forecastDto.forecastUpTo
      ? parseISO(forecastDto.forecastUpTo)
      : new Date();
    const forecastEndMonth = endOfMonth(forecastEndDate);

    // Get academic year start date
    const academicYearStart = academicYear.startDate instanceof Date 
      ? academicYear.startDate 
      : parseISO(String(academicYear.startDate));
    const forecastStartMonth = startOfMonth(
      isAfter(academicYearStart, new Date()) ? academicYearStart : new Date()
    );

    // Calculate months to forecast
    const monthsToForecast: Date[] = [];
    let currentMonth = startOfMonth(forecastStartMonth);
    while (isBefore(currentMonth, forecastEndMonth) || currentMonth.getTime() === forecastEndMonth.getTime()) {
      monthsToForecast.push(new Date(currentMonth));
      currentMonth = addMonths(currentMonth, 1);
    }

    // Get all fee structures for the student's class
    const classFeeStructures = await this.feeStructureRepository
      .createQueryBuilder('fs')
      .where('fs.schoolId = :schoolId', { schoolId })
      .andWhere('fs.status = :status', { status: StructureStatus.ACTIVE })
      .andWhere('(fs.classId = :classId OR fs.classId IS NULL)', { classId: academicRecord.classId })
      .leftJoinAndSelect('fs.category', 'category')
      .leftJoinAndSelect('fs.categoryHead', 'categoryHead')
      .leftJoinAndSelect('fs.class', 'class')
      .getMany();

    // Get existing student fee structures
    const existingFees = await this.studentFeeStructureRepository.find({
      where: {
        studentId: student.id,
        academicYearId: forecastDto.academicYearId,
      },
      relations: ['feeStructure'],
    });

    // Calculate class fees
    const classFees: ForecastResult['breakdown']['classFees']['fees'] = [];
    let classFeesTotal = 0;

    for (const feeStructure of classFeeStructures) {
      // Check if fee already exists
      const existingFee = existingFees.find(ef => ef.feeStructureId === feeStructure.id);
      
      if (existingFee) {
        // Use existing fee
        classFees.push({
          feeStructureId: feeStructure.id,
          feeStructureName: feeStructure.name,
          amount: parseFloat(existingFee.amount.toString()),
          dueDate: format(existingFee.dueDate, 'yyyy-MM-dd'),
          status: existingFee.status,
        });
        classFeesTotal += parseFloat(existingFee.amount.toString());
      } else {
        // Forecast new fee (assuming monthly generation)
        const feeAmount = parseFloat(feeStructure.amount.toString());
        const dueDate = format(forecastStartMonth, 'yyyy-MM-dd');
        
        classFees.push({
          feeStructureId: feeStructure.id,
          feeStructureName: feeStructure.name,
          amount: feeAmount,
          dueDate,
          status: PaymentStatus.PENDING,
        });
        classFeesTotal += feeAmount;
      }
    }

    // Calculate bus fees
    const busFees: ForecastResult['breakdown']['busFees']['fees'] = [];
    let busFeesTotal = 0;
    let monthlyBusAmount = 0;

    if (forecastDto.includeBusFees !== false && student.routePlanId) {
      const routePlan = await this.routePlanRepository.findOne({
        where: {
          id: student.routePlanId,
          status: RoutePlanStatus.ACTIVE,
        },
      });

      if (routePlan) {
        // Check if route plan applies to student's class
        if (!routePlan.classId || routePlan.classId === academicRecord.classId) {
          monthlyBusAmount = parseFloat(routePlan.amount.toString());

          // Generate monthly bus fees
          for (const month of monthsToForecast) {
            const dueDate = format(endOfMonth(month), 'yyyy-MM-dd');
            busFees.push({
              month: format(month, 'MMMM yyyy'),
              amount: monthlyBusAmount,
              dueDate,
            });
            busFeesTotal += monthlyBusAmount;
          }
        }
      }
    }

    // Previous balance (opening balance)
    // Include if flag is not false and opening balance exists (can be positive or negative)
    // Positive = debt (student owes), Negative = credit (student has credit)
    const previousBalance = forecastDto.includePreviousBalance !== false
      ? (student.openingBalance !== undefined && student.openingBalance !== null 
          ? parseFloat(student.openingBalance.toString()) 
          : 0)
      : 0;

    // Other fees (fees that are not class-specific or bus fees)
    // These would be manually added fees or special fees
    const otherFees: ForecastResult['breakdown']['otherFees']['fees'] = [];
    let otherFeesTotal = 0;

    // Calculate summary
    const totalAmount = classFeesTotal + busFeesTotal + previousBalance + otherFeesTotal;
    
    // Get paid amounts from existing fees
    const paidFees = existingFees.filter(ef => ef.status === PaymentStatus.PAID);
    const totalPaid = paidFees.reduce((sum, fee) => sum + parseFloat(fee.amount.toString()), 0);
    
    const pendingFees = existingFees.filter(ef => ef.status === PaymentStatus.PENDING);
    const totalPending = pendingFees.reduce((sum, fee) => sum + parseFloat(fee.amount.toString()), 0);
    
    const overdueFees = existingFees.filter(ef => 
      ef.status === PaymentStatus.OVERDUE || 
      (ef.status === PaymentStatus.PENDING && isBefore(ef.dueDate, new Date()))
    );
    const totalOverdue = overdueFees.reduce((sum, fee) => sum + parseFloat(fee.amount.toString()), 0);

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      academicYearId: academicYear.id,
      academicYearName: academicYear.name,
      className: academicRecord.class?.name || 'Unknown',
      forecastUpTo: format(forecastEndDate, 'yyyy-MM-dd'),
      totalAmount,
      breakdown: {
        classFees: {
          total: classFeesTotal,
          fees: classFees,
        },
        busFees: {
          total: busFeesTotal,
          monthlyAmount: monthlyBusAmount,
          months: monthsToForecast.length,
          fees: busFees,
        },
        previousBalance: {
          amount: previousBalance,
        },
        otherFees: {
          total: otherFeesTotal,
          fees: otherFees,
        },
      },
      summary: {
        totalDue: totalAmount,
        totalPaid,
        totalPending,
        totalOverdue,
      },
    };
  }
}

