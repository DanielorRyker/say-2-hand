

import { Injectable } from '@nestjs/common';
import QRCode from 'qrcode'; // Chuẩn ESM: import default



@Injectable()
export class QrService {
  /**
   * Tạo mã QR từ chuỗi dữ liệu (ví dụ: URL bài đăng)
   * @param data Chuỗi cần encode thành QR
   * @returns Data URL (base64) của QR code
   */
  async generateQrCode(data: string): Promise<string> {
    try {
      // Sử dụng thư viện qrcode để tạo QR dưới dạng Data URL
      const qrDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H', // Tăng độ chính xác
        type: 'image/png',
        margin: 2,
        width: 300,
      });
      return qrDataUrl;
    } catch (error) {
      // Xử lý lỗi khi tạo QR
      // Comment: Nếu tạo QR thất bại, log lỗi và throw exception
      console.error('Lỗi tạo mã QR:', error);
      throw new Error('Không thể tạo mã QR');
    }
  }
}
