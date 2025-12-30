import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, schoolId: number): Promise<Payment> {
    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      schoolId,
      paymentDate: new Date(createPaymentDto.paymentDate),
    });
    return await this.paymentsRepository.save(payment);
  }

  async findAll(schoolId?: number): Promise<Payment[]> {
    const where: any = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.paymentsRepository.find({
      where,
      relations: ['school', 'student', 'feeStructure'],
      order: { paymentDate: 'desc' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Payment> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    const payment = await this.paymentsRepository.findOne({
      where,
      relations: ['school', 'student', 'feeStructure'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByStudent(studentId: number, schoolId?: number): Promise<Payment[]> {
    const where: any = { studentId };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.paymentsRepository.find({
      where,
      relations: ['feeStructure'],
      order: { paymentDate: 'desc' },
    });
  }

  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
    schoolId?: number,
  ): Promise<Payment> {
    const payment = await this.findOne(id, schoolId);
    const updateData: any = { ...updatePaymentDto };
    if (updatePaymentDto.paymentDate) {
      updateData.paymentDate = new Date(updatePaymentDto.paymentDate);
    }
    Object.assign(payment, updateData);
    return await this.paymentsRepository.save(payment);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const payment = await this.findOne(id, schoolId);
    await this.paymentsRepository.remove(payment);
  }
}
