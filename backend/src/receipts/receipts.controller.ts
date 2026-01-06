import { Controller, Get, Param, UseGuards, Request, Res, StreamableFile, Query } from '@nestjs/common';
import { Response } from 'express';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(':id')
  async getReceipt(
    @Param('id') id: string,
    @Request() req: any,
    @Query('schoolId') querySchoolId?: number,
  ) {
    // Priority: JWT schoolId > query param > subdomain middleware
    const schoolId = req.user?.schoolId || querySchoolId || req.school?.id;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    return this.receiptsService.getReceiptData(parseInt(id, 10), schoolId);
  }

  @Get(':id/pdf')
  async downloadReceiptPdf(
    @Param('id') id: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
    @Query('schoolId') querySchoolId?: number,
  ) {
    // Priority: JWT schoolId > query param > subdomain middleware
    const schoolId = req.user?.schoolId || querySchoolId || req.school?.id;
    if (!schoolId) {
      throw new Error('School ID not found in request');
    }

    // Generate PDF
    const pdfBuffer = await this.receiptsService.generatePdfReceipt(
      parseInt(id, 10),
      schoolId,
    );

    // Get receipt data for filename
    const receiptData = await this.receiptsService.getReceiptData(
      parseInt(id, 10),
      schoolId,
    );

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Receipt_${receiptData.receiptNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }
}

