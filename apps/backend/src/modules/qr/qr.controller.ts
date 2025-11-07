import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { QrService } from './qr.service';


@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  private mockPayments = new Map<string, boolean>();

  @Get()
  generateQR(
    @Query('accountNo') accountNo: string,
    @Query('accountName') accountName: string,
    @Query('amount') amount: string,
    @Query('addInfo') addInfo: string
  ) {
    const amountNumber = Number(amount);
    if (isNaN(amountNumber)) {
      throw new BadRequestException('Amount must be a number');
    }

    const acqId = '970422'; // MB bank
    const encodedInfo = encodeURIComponent(addInfo);
    const encodedName = encodeURIComponent(accountName);
    const txnId = Math.floor(Math.random() * 1000000); // ID giao dịch giả
    this.mockPayments.set(txnId.toString(), false);

    const qrUrl = `https://img.vietqr.io/image/${acqId}-${accountNo}-compact.png?amount=${amountNumber}&addInfo=${encodedInfo}&accountName=${encodedName}`;

    return { qrUrl };
  }

  // Endpoint “quét QR” giả lập
  @Get('pay')
  pay(
    @Query('txnId') txnId: string,
    @Query('accountNo') accountNo: string,
    @Query('amount') amount: string
  ) {
    if (!this.mockPayments.has(txnId)) {
      return { success: false, message: 'Transaction not found' };
    }

    // Giả lập thanh toán thành công
    this.mockPayments.set(txnId, true);

    // Gọi callback nội bộ (thường là webhook của ngân hàng)
    console.log(`Transaction ${txnId} paid: account=${accountNo}, amount=${amount}`);

    return { success: true, message: 'Payment simulated' };
  }

  // Endpoint callback (nếu ngân hàng thật gọi)
  @Post('callback')
  paymentCallback(@Body() body: any) {
    console.log('Received payment callback:', body);
    return { received: true };
  }

  // Check trạng thái giao dịch
  @Get('status')
  status(@Query('txnId') txnId: string) {
    const paid = this.mockPayments.get(txnId) || false;
    return { txnId, paid };
  }

  
}
