import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FeeInvoice, InvoiceStatus } from '../invoices/entities/fee-invoice.entity';
import { FeeInvoiceItem } from '../invoices/entities/fee-invoice-item.entity';
import { PaymentAccountingService } from './payment-accounting.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(FeeInvoice)
    private invoiceRepository: Repository<FeeInvoice>,
    private paymentAccountingService: PaymentAccountingService,
    private dataSource: DataSource,
  ) {}

  /**
   * Generate unique receipt number
   * Format: REC-{YYYYMMDD}-{XXXX} (e.g., REC-20260103-0001)
   */
  private async generateReceiptNumber(schoolId: number): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const prefix = `REC-${dateStr}-`;

    // Find the last receipt number for today using query builder
    const lastReceipt = await this.paymentsRepository
      .createQueryBuilder('payment')
      .where('payment.receiptNumber LIKE :prefix', { prefix: `${prefix}%` })
      .andWhere('payment.schoolId = :schoolId', { schoolId })
      .orderBy('payment.receiptNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastReceipt?.receiptNumber) {
      const parts = lastReceipt.receiptNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1] || '0', 10);
      sequence = lastSeq + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }


  /**
   * Create payment against an invoice
   * This is the ONLY way to create payments - invoice-based only!
   */
  async create(createPaymentDto: CreatePaymentDto, schoolId: number): Promise<Payment> {
    // invoiceId is required in DTO, so TypeScript will enforce it
    // All payments go through invoice system
    return this.createInvoicePayment(createPaymentDto, schoolId);
  }

  async findAll(schoolId?: number): Promise<Payment[]> {
    const where: any = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.paymentsRepository.find({
      where,
      relations: [
        'school', 
        'student', 
        'invoice',
        'invoice.items',
      ],
      order: { paymentDate: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Payment> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    const payment = await this.paymentsRepository.findOne({
      where,
      relations: [
        'school', 
        'student', 
        'invoice',
        'invoice.items',
        'invoice.academicYear',
      ],
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
      relations: [
        'invoice',
        'invoice.items',
        'invoice.academicYear',
      ],
      order: { paymentDate: 'DESC', id: 'DESC' },
    });
  }

  /**
   * Get payments for a specific invoice
   */
  async findByInvoice(invoiceId: number, schoolId?: number): Promise<Payment[]> {
    const where: any = { invoiceId };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.paymentsRepository.find({
      where,
      relations: ['student', 'invoice', 'invoice.items'],
      order: { paymentDate: 'desc' },
    });
  }

  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
    schoolId?: number,
  ): Promise<Payment> {
    const payment = await this.findOne(id, schoolId);

    // Prevent changing payment amount (would require recalculating invoice balances)
    if (updatePaymentDto.amount !== undefined && payment.invoiceId) {
      throw new BadRequestException(
        'Updating payment amount for invoice-based payments is not supported. ' +
        'Please void/delete this payment and create a new one.'
      );
    }

    const updateData: any = { ...updatePaymentDto };
    
    if (updatePaymentDto.paymentDate) {
      updateData.paymentDate = new Date(updatePaymentDto.paymentDate);
    }

    // CRITICAL FIX: Convert empty transactionId to undefined (stored as NULL in DB)
    if ('transactionId' in updatePaymentDto) {
      updateData.transactionId = updatePaymentDto.transactionId && updatePaymentDto.transactionId.trim() !== ''
        ? updatePaymentDto.transactionId
        : undefined;
    }

    Object.assign(payment, updateData);
    const updatedPayment = await this.paymentsRepository.save(payment);

    return await this.findOne(updatedPayment.id, schoolId);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const payment = await this.findOne(id, schoolId);
    
    // For invoice-based payments, we should update invoice balances when deleting
    if (payment.invoiceId) {
      this.logger.warn(
        `Deleting payment ${id} for invoice ${payment.invoiceId}. ` +
        `Invoice balances should be manually recalculated or use POST /invoices/${payment.invoiceId}/recalculate`
      );
    }
    
    await this.paymentsRepository.remove(payment);
  }

  /**
   * ==========================================
   * INVOICE-BASED PAYMENT (NEW WAY)
   * ==========================================
   * Create payment against an invoice (supports mixed fee types)
   */
  private async createInvoicePayment(createPaymentDto: CreatePaymentDto, schoolId: number): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock invoice row to prevent race conditions
      // Note: We can't use relations with pessimistic lock due to PostgreSQL restriction:
      // "FOR UPDATE cannot be applied to the nullable side of an outer join"
      // So we lock just the invoice, then load items separately
      const invoice = await queryRunner.manager.findOne(FeeInvoice, {
        where: { id: createPaymentDto.invoiceId, schoolId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!invoice) {
        throw new NotFoundException(
          `Invoice #${createPaymentDto.invoiceId} not found for school ${schoolId}`
        );
      }

      // Load items in a separate query (within the same transaction)
      invoice.items = await queryRunner.manager.find(FeeInvoiceItem, {
        where: { invoiceId: invoice.id },
      });

      // Validate invoice belongs to the student
      if (invoice.studentId !== createPaymentDto.studentId) {
        throw new BadRequestException(
          `Invoice #${invoice.invoiceNumber} does not belong to student ${createPaymentDto.studentId}`
        );
      }

      // Validate invoice is not draft or cancelled
      if (invoice.status === InvoiceStatus.DRAFT) {
        throw new BadRequestException(
          `Cannot make payment against draft invoice #${invoice.invoiceNumber}. Please finalize it first.`
        );
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException(
          `Cannot make payment against cancelled invoice #${invoice.invoiceNumber}`
        );
      }

      // Calculate remaining balance
      const remainingBalance = Number(invoice.balanceAmount);

      // Validate payment amount
      if (createPaymentDto.amount > remainingBalance) {
        throw new BadRequestException(
          `Payment amount (₹${createPaymentDto.amount}) exceeds remaining balance (₹${remainingBalance.toFixed(2)}) for invoice #${invoice.invoiceNumber}`
        );
      }

      if (createPaymentDto.amount <= 0) {
        throw new BadRequestException('Payment amount must be greater than 0');
      }

      // Generate receipt number if not provided
      let receiptNumber = createPaymentDto.receiptNumber;
      if (!receiptNumber) {
        receiptNumber = await this.generateReceiptNumber(schoolId);
      } else {
        // Check if receipt number already exists
        const existingReceipt = await queryRunner.manager.findOne(Payment, {
          where: { receiptNumber, schoolId },
        });
        if (existingReceipt) {
          throw new BadRequestException(`Receipt number ${receiptNumber} already exists`);
        }
      }

      // Create payment
      const payment = queryRunner.manager.create(Payment, {
        studentId: createPaymentDto.studentId,
        invoiceId: createPaymentDto.invoiceId,
        studentFeeStructureId: undefined, // Always undefined (invoice-based payments only)
        amount: createPaymentDto.amount,
        paymentDate: new Date(createPaymentDto.paymentDate),
        paymentMethod: createPaymentDto.paymentMethod || 'cash' as any,
        // CRITICAL FIX: Convert empty transactionId to undefined to avoid unique constraint violations
        // PostgreSQL allows multiple NULL values but not multiple empty strings
        transactionId: createPaymentDto.transactionId && createPaymentDto.transactionId.trim() !== '' 
          ? createPaymentDto.transactionId 
          : undefined,
        receiptNumber,
        status: createPaymentDto.status || PaymentStatus.COMPLETED,
        notes: createPaymentDto.notes,
        schoolId,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      // Update invoice amounts
      const newPaidAmount = Number(invoice.paidAmount) + createPaymentDto.amount;
      const newBalanceAmount = remainingBalance - createPaymentDto.amount;

      // Determine new status
      let newStatus = invoice.status;
      if (newBalanceAmount <= 0.01) {
        newStatus = InvoiceStatus.PAID;
      } else if (newPaidAmount > 0) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      }

      await queryRunner.manager.update(FeeInvoice, invoice.id, {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newStatus,
      });

      await queryRunner.commitTransaction();

      this.logger.log(
        `Invoice payment created: ₹${createPaymentDto.amount} for invoice #${invoice.invoiceNumber} (Receipt: ${receiptNumber})`
      );

      // Create accounting entry
      try {
        await this.paymentAccountingService.recordPaymentAccounting(
          schoolId,
          savedPayment,
        );
      } catch (accountingError) {
        this.logger.error(`Failed to create accounting entry for payment ${savedPayment.id}:`, accountingError);
        // Don't fail the payment if accounting fails
      }

      // Return payment with relations
      return await this.paymentsRepository.findOne({
        where: { id: savedPayment.id },
        relations: ['student', 'invoice', 'invoice.items'],
      }) as Payment;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
