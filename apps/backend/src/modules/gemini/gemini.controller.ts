import { Controller, Post, Body } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('analyze-image')
  async analyzeImage(@Body() body: { base64: string; mimeType?: string }) {
    // Validate base64 and mimeType
    let mimeType = body.mimeType || 'image/jpeg';
    if (!/^image\/(jpeg|png|webp|gif)$/.test(mimeType)) {
      mimeType = 'image/jpeg';
    }
    return await this.geminiService.analyzeImage(body.base64, mimeType);
  }

  @Post('analyze-multiple-images')
  async analyzeMultipleImages(
    @Body() body: { images: Array<{ base64: string; mimeType?: string }> },
  ) {
    // Validate và chuẩn hóa mimeType cho mỗi ảnh
    const images = body.images.map((img) => {
      let mimeType = img.mimeType || 'image/jpeg';
      if (!/^image\/(jpeg|png|webp|gif)$/.test(mimeType)) {
        mimeType = 'image/jpeg';
      }
      return { base64: img.base64, mimeType };
    });
    return await this.geminiService.analyzeMultipleImages(images);
  }

  @Post('normalize-address')
  async normalizeAddress(@Body() body: { address: string }) {
    if (!body.address || typeof body.address !== 'string') {
      return {
        normalized: '',
        detail_address: '',
        ward: '',
        district: '',
        province: '',
        confidence: 0,
      };
    }
    return await this.geminiService.normalizeVietnameseAddress(body.address);
  }
}
