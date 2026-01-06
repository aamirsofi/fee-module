import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

export interface ReceiptData {
  receiptNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  student: {
    name: string;
    studentId: string;
    class?: string;
    section?: string;
  };
  school: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  items: Array<{
    description: string;
    amount: number;
  }>;
  invoice?: {
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
  };
  academicYear?: string;
}

@Injectable()
export class PdfGeneratorService {
  /**
   * Generate a PDF receipt
   */
  generateReceipt(receiptData: ReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Build PDF content
        this.buildReceiptPDF(doc, receiptData);

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Build the PDF content
   */
  private buildReceiptPDF(doc: PDFKit.PDFDocument, data: ReceiptData) {
    const pageWidth = doc.page.width - 100; // Minus margins

    // Header Section
    this.addHeader(doc, data.school, pageWidth);

    // Title
    doc.moveDown(2);
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('FEE RECEIPT', { align: 'center' });

    // Receipt Number and Date
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    
    const leftCol = 50;
    const rightCol = doc.page.width - 200;
    
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Receipt No:', leftCol, doc.y)
      .font('Helvetica')
      .text(data.receiptNumber, leftCol + 80, doc.y - 11);

    doc
      .font('Helvetica-Bold')
      .text('Date:', rightCol, doc.y - 11)
      .font('Helvetica')
      .text(format(new Date(data.paymentDate), 'dd MMM yyyy'), rightCol + 40, doc.y - 11);

    // Line separator
    doc.moveDown(1);
    this.drawLine(doc, pageWidth);

    // Student Details Section
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('Student Details:', leftCol);
    doc.moveDown(0.5);

    const detailsY = doc.y;
    doc.fontSize(10).font('Helvetica');

    // Left column - Student info
    doc.text(`Name: ${data.student.name}`, leftCol, detailsY);
    doc.text(`Student ID: ${data.student.studentId}`, leftCol, doc.y + 5);
    if (data.student.class) {
      doc.text(`Class: ${data.student.class}${data.student.section ? ` - ${data.student.section}` : ''}`, leftCol, doc.y + 5);
    }

    // Right column - Academic year
    if (data.academicYear) {
      doc.text(`Academic Year: ${data.academicYear}`, rightCol, detailsY);
    }

    // Line separator
    doc.moveDown(1.5);
    this.drawLine(doc, pageWidth);

    // Invoice Details (if available)
    if (data.invoice) {
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica-Bold').text('Invoice Details:', leftCol);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice No: ${data.invoice.invoiceNumber}`, leftCol);
      doc.text(`Issue Date: ${format(new Date(data.invoice.issueDate), 'dd MMM yyyy')}`, leftCol, doc.y + 5);
      doc.text(`Due Date: ${format(new Date(data.invoice.dueDate), 'dd MMM yyyy')}`, leftCol, doc.y + 5);
      
      doc.moveDown(1);
      this.drawLine(doc, pageWidth);
    }

    // Fee Details Table
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('Fee Details:', leftCol);
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const descCol = leftCol;
    const amountCol = doc.page.width - 150;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Description', descCol, tableTop)
      .text('Amount (₹)', amountCol, tableTop);

    // Table line
    doc.moveDown(0.3);
    this.drawLine(doc, pageWidth);
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica');
    data.items.forEach((item) => {
      doc.text(item.description, descCol, doc.y);
      doc.text(item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), amountCol, doc.y - 11, {
        width: 100,
        align: 'right',
      });
      doc.moveDown(0.5);
    });

    // Total line
    doc.moveDown(0.3);
    this.drawLine(doc, pageWidth);
    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Amount Paid:', descCol, doc.y)
      .text(`₹ ${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, amountCol, doc.y - 12, {
        width: 100,
        align: 'right',
      });

    doc.moveDown(0.5);
    this.drawLine(doc, pageWidth);

    // Payment Details
    doc.moveDown(1.5);
    doc.fontSize(12).font('Helvetica-Bold').text('Payment Details:', leftCol);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    
    doc.text(`Payment Method: ${this.formatPaymentMethod(data.paymentMethod)}`, leftCol);
    if (data.transactionId) {
      doc.text(`Transaction ID: ${data.transactionId}`, leftCol, doc.y + 5);
    }
    doc.text(`Payment Status: Completed`, leftCol, doc.y + 5);

    // Amount in words
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Oblique');
    doc.text(`Amount in words: ${this.numberToWords(data.amount)} Rupees Only`, leftCol, doc.y, {
      width: pageWidth,
    });

    // Footer
    doc.moveDown(3);
    this.drawLine(doc, pageWidth);
    doc.moveDown(0.5);

    doc.fontSize(8).font('Helvetica');
    doc.text('This is a computer-generated receipt and does not require a signature.', leftCol, doc.y, {
      align: 'center',
      width: pageWidth,
    });

    doc.moveDown(0.5);
    doc.text(
      `Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`,
      leftCol,
      doc.y,
      {
        align: 'center',
        width: pageWidth,
      },
    );

    // School contact info footer
    if (data.school.phone || data.school.email) {
      doc.moveDown(1);
      const contactInfo = [];
      if (data.school.phone) contactInfo.push(`Phone: ${data.school.phone}`);
      if (data.school.email) contactInfo.push(`Email: ${data.school.email}`);
      
      doc.text(contactInfo.join(' | '), leftCol, doc.y, {
        align: 'center',
        width: pageWidth,
      });
    }
  }

  /**
   * Add header with school info
   */
  private addHeader(doc: PDFKit.PDFDocument, school: ReceiptData['school'], pageWidth: number) {
    const leftCol = 50;

    // School name
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(school.name.toUpperCase(), leftCol, 50, {
        align: 'center',
        width: pageWidth,
      });

    // School address
    if (school.address) {
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(school.address, leftCol, doc.y, {
          align: 'center',
          width: pageWidth,
        });
    }

    // Horizontal line
    doc.moveDown(0.5);
    this.drawLine(doc, pageWidth);
  }

  /**
   * Draw a horizontal line
   */
  private drawLine(doc: PDFKit.PDFDocument, width: number) {
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(50 + width, doc.y)
      .stroke();
  }

  /**
   * Format payment method for display
   */
  private formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      cash: 'Cash',
      bank: 'Bank Transfer',
      upi: 'UPI',
      card: 'Card',
      gateway: 'Online Payment',
      cheque: 'Cheque',
    };
    return methodMap[method.toLowerCase()] || method;
  }

  /**
   * Convert number to words (Indian numbering system)
   */
  private numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let result = convert(rupees);
    if (paise > 0) {
      result += ' and ' + convert(paise) + ' Paise';
    }

    return result;
  }
}

