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
}
