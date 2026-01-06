import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Like } from 'typeorm';
import { FeeInvoice, InvoiceType } from './entities/fee-invoice.entity';
import { FeeInvoiceItem, InvoiceSourceType } from './entities/fee-invoice-item.entity';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
import { UpdateFeeInvoiceDto } from './dto/update-fee-invoice.dto';
import { InvoiceStatus } from './entities/fee-invoice.entity';
import { AccountingService } from '../accounting/accounting.service';
import { AccountType, AccountSubtype } from '../accounting/entities/account.entity';
import { JournalEntryType } from '../accounting/entities/journal-entry.entity';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';
import { Student } from '../students/entities/student.entity';
import { StudentAcademicRecord } from '../student-academic-records/entities/student-academic-record.entity';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(FeeInvoice)
    private invoiceRepository: Repository<FeeInvoice>,
    @InjectRepository(FeeInvoiceItem)
    private invoiceItemRepository: Repository<FeeInvoiceItem>,
    @InjectRepository(FeeStructure)
    private feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(StudentAcademicRecord)
    private academicRecordRepository: Repository<StudentAcademicRecord>,
    private accountingService: AccountingService,
    private dataSource: DataSource,
  ) {}

  async create(schoolId: number, createInvoiceDto: CreateFeeInvoiceDto): Promise<FeeInvoice> {
    // Validate items
    if (!createInvoiceDto.items || createInvoiceDto.items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    // Calculate totals
    const totalAmount = createInvoiceDto.items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const discountAmount = createInvoiceDto.items.reduce(
      (sum, item) => sum + Number(item.discountAmount || 0),
      0,
    );
    const balanceAmount = totalAmount - discountAmount;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(schoolId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create invoice with DRAFT status (will be finalized separately)
      const invoice = queryRunner.manager.create(FeeInvoice, {
        schoolId,
        studentId: createInvoiceDto.studentId,
        academicYearId: createInvoiceDto.academicYearId,
        invoiceNumber,
        issueDate: new Date(createInvoiceDto.issueDate),
        dueDate: new Date(createInvoiceDto.dueDate),
        type: createInvoiceDto.type,
        status: InvoiceStatus.DRAFT, // Start as DRAFT, finalize separately
        totalAmount,
        discountAmount,
        balanceAmount,
        paidAmount: 0,
        notes: createInvoiceDto.notes,
      });

      const savedInvoice = await queryRunner.manager.save(FeeInvoice, invoice);

      // Create invoice items with polymorphic support
      const items = createInvoiceDto.items.map(item =>
        queryRunner.manager.create(FeeInvoiceItem, {
          invoiceId: savedInvoice.id,
          // Polymorphic fields
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          sourceMetadata: item.sourceMetadata,
          description: item.description,
          amount: Number(item.amount),
          discountAmount: Number(item.discountAmount || 0),
          dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
          notes: item.notes,
        }),
      );

      await queryRunner.manager.save(FeeInvoiceItem, items);

      await queryRunner.commitTransaction();

      // Reload with all relations
      // Note: Accounting entries will be created when invoice is finalized
      return this.invoiceRepository.findOne({
        where: { id: savedInvoice.id },
        relations: ['items', 'student', 'academicYear'],
      }) as Promise<FeeInvoice>;
    } catch (error) {
      // Only rollback if transaction is still active
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create accounting entry for invoice generation
   * Debit: Fees Receivable
   * Credit: Fee Income (based on invoice items)
   */
  private async createInvoiceAccountingEntry(
    schoolId: number,
    invoice: FeeInvoice,
  ): Promise<any> {
    // Get accounts using Account entity
    const AccountEntity = (await import('../accounting/entities/account.entity')).Account;
    const accountRepository = this.dataSource.getRepository(AccountEntity);
    
    const feesReceivableAccount = await accountRepository.findOne({
      where: {
        schoolId,
        type: AccountType.ASSET,
        subtype: AccountSubtype.RECEIVABLE,
      },
    });

    if (!feesReceivableAccount) {
      throw new BadRequestException('Fees Receivable account not found. Please initialize chart of accounts.');
    }

    // Get income accounts (we'll use a default one for now, can be enhanced)
    const feeIncomeAccount = await accountRepository.findOne({
      where: {
        schoolId,
        type: AccountType.INCOME,
        subtype: AccountSubtype.OPERATING_INCOME,
      },
    });

    if (!feeIncomeAccount) {
      throw new BadRequestException('Fee Income account not found. Please initialize chart of accounts.');
    }

    // Create journal entry (outside transaction to avoid nested transactions)
    // We'll create it after the invoice transaction commits
    // Note: This is a simplified approach. In production, you might want to use event-driven architecture
    
    // Convert issueDate to proper format (handle both Date objects and strings)
    const entryDate = invoice.issueDate instanceof Date 
      ? invoice.issueDate.toISOString() 
      : new Date(invoice.issueDate).toISOString();
    
    const journalEntryDto = {
      entryDate,
      type: JournalEntryType.INVOICE,
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.items.map((i: any) => i.description).join(', ')}`,
      reference: invoice.invoiceNumber,
      referenceId: invoice.id,
      lines: [
        {
          accountId: feesReceivableAccount.id,
          debitAmount: invoice.balanceAmount,
          creditAmount: 0,
          description: `Fees Receivable - Invoice ${invoice.invoiceNumber}`,
        },
        {
          accountId: feeIncomeAccount.id,
          debitAmount: 0,
          creditAmount: invoice.balanceAmount,
          description: `Fee Income - Invoice ${invoice.invoiceNumber}`,
        },
      ],
      notes: `Invoice generated for student ${invoice.studentId}`,
    };

    // Create accounting entry and return it
    const journalEntry = await this.accountingService.createJournalEntry(schoolId, journalEntryDto);
    return journalEntry;
  }

  async findAll(schoolId: number, studentId?: number, status?: string): Promise<FeeInvoice[]> {
    const where: any = { schoolId };
    if (studentId) {
      where.studentId = studentId;
    }
    if (status) {
      where.status = status;
    }

    return this.invoiceRepository.find({
      where,
      relations: ['items', 'student', 'academicYear'],
      order: { issueDate: 'DESC' },
    });
  }

  async findOne(id: number, schoolId: number): Promise<FeeInvoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, schoolId },
      relations: ['items', 'student', 'academicYear'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(id: number, schoolId: number, updateInvoiceDto: UpdateFeeInvoiceDto): Promise<FeeInvoice> {
    const invoice = await this.findOne(id, schoolId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Can only update draft invoices');
    }

    Object.assign(invoice, updateInvoiceDto);
    return this.invoiceRepository.save(invoice);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    const invoice = await this.findOne(id, schoolId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Can only delete draft invoices');
    }

    await this.invoiceRepository.remove(invoice);
  }

  /**
   * Finalize invoice - lock it and create accounting entries
   * Changes status from DRAFT to ISSUED
   * 
   * This method is IDEMPOTENT - safe to call multiple times.
   * If already finalized, just returns the invoice without error.
   */
  async finalize(id: number, schoolId: number): Promise<FeeInvoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, schoolId },
      relations: ['items'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // IDEMPOTENT: If already finalized, just return it
    // Check 1: Status is not DRAFT (already finalized)
    // Check 2: Has journalEntryId (accounting entry already created)
    if ((invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.CANCELLED) || invoice.journalEntryId) {
      this.logger.log(
        `Invoice #${invoice.invoiceNumber} is already finalized (status: ${invoice.status}, journalEntryId: ${invoice.journalEntryId}), skipping finalization`
      );
      
      // Reload with full relations before returning
      return this.invoiceRepository.findOne({
        where: { id, schoolId },
        relations: ['items', 'student', 'academicYear'],
      }) as Promise<FeeInvoice>;
    }

    // Validate that invoice has items
    if (!invoice.items || invoice.items.length === 0) {
      throw new BadRequestException('Cannot finalize invoice without items');
    }

    // Validate that invoice has amounts
    if (invoice.totalAmount <= 0) {
      throw new BadRequestException('Cannot finalize invoice with zero total amount');
    }

    // Create accounting entry (Dr Fees Receivable, Cr Income accounts)
    // First check if journal entry already exists for this invoice
    const JournalEntryEntity = (await import('../accounting/entities/journal-entry.entity')).JournalEntry;
    const journalEntryRepository = this.dataSource.getRepository(JournalEntryEntity);
    
    const existingJournalEntry = await journalEntryRepository.findOne({
      where: {
        schoolId,
        referenceId: invoice.id,
        type: (await import('../accounting/entities/journal-entry.entity')).JournalEntryType.INVOICE,
      },
    });

    let journalEntryId: number | undefined;

    if (existingJournalEntry) {
      // Journal entry already exists - link it to invoice
      this.logger.log(
        `Invoice #${invoice.invoiceNumber} already has journal entry #${existingJournalEntry.entryNumber}, linking it`
      );
      journalEntryId = existingJournalEntry.id;
    } else {
      // No journal entry exists - create one
      try {
        const createdEntry = await this.createInvoiceAccountingEntry(schoolId, invoice);
        journalEntryId = createdEntry?.id;
        this.logger.log(
          `Created new journal entry for invoice #${invoice.invoiceNumber}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to create accounting entry for invoice ${invoice.id}: ${(error as Error).message}`,
          (error as Error).stack,
        );
        throw new BadRequestException(
          `Failed to create accounting entry: ${(error as Error).message}`
        );
      }
    }

    // Update invoice status to ISSUED (ready for payment) and link journal entry
    invoice.status = InvoiceStatus.ISSUED;
    if (journalEntryId) {
      invoice.journalEntryId = journalEntryId;
    }
    const finalizedInvoice = await this.invoiceRepository.save(invoice);
    
    this.logger.log(
      `Invoice #${finalizedInvoice.invoiceNumber} finalized successfully (status: ${finalizedInvoice.status}, journalEntryId: ${finalizedInvoice.journalEntryId})`
    );
    
    return finalizedInvoice;
  }

  private async generateInvoiceNumber(schoolId: number): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvoice = await this.invoiceRepository.findOne({
      where: { schoolId, invoiceNumber: Like(`${prefix}%`) },
      order: { invoiceNumber: 'DESC' },
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Generate invoice from fee structures for a student
   * Prevents duplicate invoices for the same student + period + type
   */
  async generateInvoiceFromFeeStructures(
    schoolId: number,
    studentId: number,
    academicYearId: number,
    type: InvoiceType,
    periodMonth?: number,
    periodQuarter?: number,
    periodYear?: number,
    issueDate?: Date,
    dueDate?: Date,
  ): Promise<FeeInvoice> {
    // Get student with current academic record
    const student = await this.studentRepository.findOne({
      where: { id: studentId, schoolId },
      relations: ['academicRecords', 'academicRecords.class', 'academicRecords.academicYear'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Get current academic record for the academic year
    const academicRecord = await this.academicRecordRepository.findOne({
      where: {
        studentId,
        academicYearId,
        schoolId,
      },
      relations: ['class'],
    });

    if (!academicRecord || !academicRecord.classId) {
      throw new BadRequestException(`Student does not have a class assigned for academic year ${academicYearId}`);
    }

    // Check for duplicate invoice
    const duplicateCheck: any = {
      schoolId,
      studentId,
      academicYearId,
      type,
    };

    if (type === InvoiceType.MONTHLY && periodMonth && periodYear) {
      duplicateCheck.periodMonth = periodMonth;
      duplicateCheck.periodYear = periodYear;
    } else if (type === InvoiceType.QUARTERLY && periodQuarter && periodYear) {
      duplicateCheck.periodQuarter = periodQuarter;
      duplicateCheck.periodYear = periodYear;
    } else if (type === InvoiceType.YEARLY && periodYear) {
      duplicateCheck.periodYear = periodYear;
    }

    const existingInvoice = await this.invoiceRepository.findOne({
      where: duplicateCheck,
    });

    if (existingInvoice) {
      const periodStr = type === InvoiceType.MONTHLY
        ? `Month ${periodMonth}/${periodYear}`
        : type === InvoiceType.QUARTERLY
        ? `Quarter ${periodQuarter}/${periodYear}`
        : `Year ${periodYear}`;
      throw new BadRequestException(
        `Invoice already exists for student ${studentId} for ${periodStr}. Invoice #${existingInvoice.invoiceNumber}`,
      );
    }

    // Get fee structures for the student's class
    const feeStructures = await this.feeStructureRepository.find({
      where: {
        schoolId,
        classId: academicRecord.classId,
        status: 'active' as any,
      },
      relations: ['category', 'categoryHead'],
    });

    if (feeStructures.length === 0) {
      throw new BadRequestException(`No fee structures found for class ${academicRecord.classId}`);
    }

    // Calculate period dates if not provided
    const now = new Date();
    const calculatedIssueDate = issueDate || now;
    let calculatedDueDate = dueDate;

    if (!calculatedDueDate) {
      if (type === InvoiceType.MONTHLY && periodMonth && periodYear) {
        // Due date: end of the month
        calculatedDueDate = new Date(periodYear, periodMonth, 0); // Last day of month
      } else if (type === InvoiceType.QUARTERLY && periodQuarter && periodYear) {
        // Due date: end of quarter
        const quarterEndMonth = periodQuarter * 3 - 1; // 0-indexed: Q1=2 (March), Q2=5 (June), etc.
        calculatedDueDate = new Date(periodYear, quarterEndMonth + 1, 0);
      } else if (type === InvoiceType.YEARLY && periodYear) {
        // Due date: end of academic year (you may want to get this from academic year entity)
        calculatedDueDate = new Date(periodYear, 11, 31); // Dec 31
      } else {
        // Default: 30 days from issue date
        calculatedDueDate = new Date(calculatedIssueDate);
        calculatedDueDate.setDate(calculatedDueDate.getDate() + 30);
      }
    }

    // Calculate totals from fee structures with polymorphic fields
    const items = feeStructures.map((fs) => ({
      sourceType: InvoiceSourceType.FEE,
      sourceId: fs.id,
      sourceMetadata: {
        feeStructureName: fs.name,
        categoryId: fs.category?.id,
        categoryHeadId: fs.categoryHead?.id,
        classId: fs.classId,
        capturedAt: new Date().toISOString(),
      },
      description: fs.name,
      amount: Number(fs.amount),
      discountAmount: 0,
      dueDate: fs.dueDate ? fs.dueDate.toISOString().split('T')[0] : calculatedDueDate.toISOString().split('T')[0],
      notes: fs.description || undefined,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const balanceAmount = totalAmount - discountAmount;

    // Create invoice DTO
    const createInvoiceDto: CreateFeeInvoiceDto = {
      studentId,
      academicYearId,
      issueDate: calculatedIssueDate.toISOString().split('T')[0],
      dueDate: calculatedDueDate.toISOString().split('T')[0],
      type,
      items,
      notes: `Auto-generated invoice from fee structures for ${type} period`,
    };

    // Create invoice using existing create method
    const invoice = await this.create(schoolId, createInvoiceDto);

    // Update invoice with period information
    invoice.periodMonth = periodMonth || undefined;
    invoice.periodQuarter = periodQuarter || undefined;
    invoice.periodYear = periodYear || now.getFullYear();

    return await this.invoiceRepository.save(invoice);
  }

  /**
   * ==========================================
   * POLYMORPHIC INVOICE ITEM METHODS
   * ==========================================
   * These methods allow adding different types of charges to an invoice
   */

  /**
   * Add transport fee to an existing invoice
   */
  async addTransportItemToInvoice(
    invoiceId: number,
    schoolId: number,
    routePriceId: number,
    description?: string,
    amount?: number,
  ): Promise<FeeInvoice> {
    const invoice = await this.findOne(invoiceId, schoolId);

    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException('Can only add items to draft or issued invoices');
    }

    // Get route price details (if you want to auto-populate)
    const RoutePriceEntity = (await import('../route-prices/entities/route-price.entity')).RoutePrice;
    const routePriceRepo = this.dataSource.getRepository(RoutePriceEntity);
    const routePrice = await routePriceRepo.findOne({
      where: { id: routePriceId, schoolId },
      relations: ['route'],
    });

    if (!routePrice) {
      throw new NotFoundException(`Route price with ID ${routePriceId} not found`);
    }

    const item = this.invoiceItemRepository.create({
      invoiceId,
      sourceType: InvoiceSourceType.TRANSPORT,
      sourceId: routePriceId,
      description: description || `Transport Fee - ${routePrice.route?.name || 'Route'}`,
      amount: amount || Number(routePrice.amount),
      discountAmount: 0,
      sourceMetadata: {
        routeId: routePrice.routeId,
        routeName: routePrice.route?.name,
        classId: routePrice.classId,
        categoryHeadId: routePrice.categoryHeadId,
        capturedAt: new Date().toISOString(),
      },
    });

    await this.invoiceItemRepository.save(item);

    // Recalculate totals
    await this.recalculateInvoiceTotals(invoiceId);

    return this.findOne(invoiceId, schoolId);
  }

  /**
   * Add hostel fee to an existing invoice
   * (Implement when you have hostel entities)
   */
  async addHostelItemToInvoice(
    invoiceId: number,
    schoolId: number,
    hostelPlanId: number,
    description: string,
    amount: number,
    metadata?: Record<string, any>,
  ): Promise<FeeInvoice> {
    const invoice = await this.findOne(invoiceId, schoolId);

    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException('Can only add items to draft or issued invoices');
    }

    const item = this.invoiceItemRepository.create({
      invoiceId,
      sourceType: InvoiceSourceType.HOSTEL,
      sourceId: hostelPlanId,
      description,
      amount,
      discountAmount: 0,
      sourceMetadata: {
        ...metadata,
        capturedAt: new Date().toISOString(),
      },
    });

    await this.invoiceItemRepository.save(item);

    // Recalculate totals
    await this.recalculateInvoiceTotals(invoiceId);

    return this.findOne(invoiceId, schoolId);
  }

  /**
   * Add fine to an existing invoice
   */
  async addFineToInvoice(
    invoiceId: number,
    schoolId: number,
    fineId: number,
    description: string,
    amount: number,
    metadata?: Record<string, any>,
  ): Promise<FeeInvoice> {
    const invoice = await this.findOne(invoiceId, schoolId);

    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException('Can only add items to draft or issued invoices');
    }

    const item = this.invoiceItemRepository.create({
      invoiceId,
      sourceType: InvoiceSourceType.FINE,
      sourceId: fineId,
      description,
      amount,
      discountAmount: 0,
      sourceMetadata: {
        ...metadata,
        capturedAt: new Date().toISOString(),
      },
    });

    await this.invoiceItemRepository.save(item);

    // Recalculate totals
    await this.recalculateInvoiceTotals(invoiceId);

    return this.findOne(invoiceId, schoolId);
  }

  /**
   * Add miscellaneous charge to an existing invoice
   */
  async addMiscItemToInvoice(
    invoiceId: number,
    schoolId: number,
    miscChargeId: number,
    description: string,
    amount: number,
    metadata?: Record<string, any>,
  ): Promise<FeeInvoice> {
    const invoice = await this.findOne(invoiceId, schoolId);

    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException('Can only add items to draft or issued invoices');
    }

    const item = this.invoiceItemRepository.create({
      invoiceId,
      sourceType: InvoiceSourceType.MISC,
      sourceId: miscChargeId,
      description,
      amount,
      discountAmount: 0,
      sourceMetadata: {
        ...metadata,
        capturedAt: new Date().toISOString(),
      },
    });

    await this.invoiceItemRepository.save(item);

    // Recalculate totals
    await this.recalculateInvoiceTotals(invoiceId);

    return this.findOne(invoiceId, schoolId);
  }

  /**
   * Recalculate invoice totals after adding/removing items
   */
  private async recalculateInvoiceTotals(invoiceId: number): Promise<void> {
    const items = await this.invoiceItemRepository.find({
      where: { invoiceId },
    });

    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const discountAmount = items.reduce((sum, item) => sum + Number(item.discountAmount), 0);
    const netAmount = totalAmount - discountAmount;

    // Get current paid amount
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (invoice) {
      const balanceAmount = netAmount - Number(invoice.paidAmount);

      await this.invoiceRepository.update(invoiceId, {
        totalAmount,
        discountAmount,
        balanceAmount,
      });
    }
  }
}

