import { Controller, Post, Body } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import type { CustomField } from '../../common/types';

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

  @Post('generate-custom-fields')
  async generateCustomFields(
    @Body() body: { categoryId: string; categoryName: string },
  ) {
    if (!body.categoryId || !body.categoryName) {
      return {
        success: false,
        message: 'categoryId and categoryName are required',
        fields: [],
      };
    }

    try {
      const fields = await this.geminiService.generateCustomFields(
        body.categoryId,
        body.categoryName,
      );
      return {
        success: true,
        categoryId: body.categoryId,
        categoryName: body.categoryName,
        fields,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        fields: [],
      };
    }
  }

  @Post('auto-fill-custom-fields')
  async autoFillCustomFields(
    @Body()
    body: {
      categoryName: string;
      customFields: CustomField[];
      images: Array<{ base64: string; mimeType?: string }>;
      description: string;
    },
  ) {
    if (!body.categoryName || !body.customFields) {
      return {
        success: false,
        message: 'categoryName and customFields are required',
        filledValues: {},
      };
    }

    try {
      const filledValues = await this.geminiService.autoFillCustomFields(
        body.categoryName,
        body.customFields,
        body.images || [],
        body.description || '',
      );
      return {
        success: true,
        filledValues,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        filledValues: {},
      };
    }
  }
}
