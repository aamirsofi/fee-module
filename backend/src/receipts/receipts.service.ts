import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';

/**
 * Receipt Service
 * Handles receipt generation and retrieval for invoice-based payments
 */
@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Get receipt data for a payment (invoice-based only)
   */
  async getReceiptData(paymentId: number, schoolId: number) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, schoolId },
      relations: [
        'student',
        'invoice',
        'invoice.items',
        'invoice.academicYear',
        'school',
      ],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (!payment.invoiceId || !payment.invoice) {
      throw new NotFoundException('Invoice not found for this payment');
    }

    // Get fee details from invoice items
    const feeDetails = payment.invoice.items.map(item => ({
      name: item.description,
      amount: Number(item.amount),
    }));

    const totalAmount = Number(payment.invoice.totalAmount || 0);
    const paidAmount = Number(payment.invoice.paidAmount || 0);
    const remainingBalance = Number(payment.invoice.balanceAmount || 0);

    return {
      receiptNumber: payment.receiptNumber,
      receiptDate: payment.paymentDate,
      payment: {
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        transactionId: payment.transactionId,
        notes: payment.notes,
      },
      student: {
        id: payment.student.id,
        studentId: payment.student.studentId,
        name: `${payment.student.firstName} ${payment.student.lastName}`,
        class: payment.invoice.academicYear?.name || 'N/A',
      },
      invoice: {
        invoiceNumber: payment.invoice.invoiceNumber,
        issueDate: payment.invoice.issueDate,
        dueDate: payment.invoice.dueDate,
        totalAmount,
        paidAmount,
        remainingBalance,
      },
      fees: feeDetails,
      school: {
        name: payment.school.name,
        address: payment.school.address,
        phone: payment.school.phone,
        email: payment.school.email,
        logo: payment.school.logo,
      },
    };
  }
}
