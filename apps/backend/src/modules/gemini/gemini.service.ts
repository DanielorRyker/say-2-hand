import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';

export interface ImageAnalysisResult {
  suggestedCategory: {
    _id: string;
    name: string;
    confidence: number;
  } | null;
  suggestedTags: string[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private ai: GoogleGenAI;

  constructor(
    private configService: ConfigService,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {
    this.ai = new GoogleGenAI({});
    this.logger.log('Gemini AI initialized');
  }

  async analyzeImage(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
  ): Promise<ImageAnalysisResult> {
    try {
      const categories = await this.categoryModel.find().exec();
      const categoryList = categories.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
      }));

      const prompt = `
	Bạn là một AI chuyên phân tích hình ảnh để phân loại sản phẩm trong ứng dụng mua bán đồ cũ Say2Hand.
	Hãy phân tích hình ảnh này và:
	1. Xác định đối tượng chính trong ảnh
	2. Chọn danh mục phù hợp nhất từ danh sách sau (trả về _id và name):
	${categoryList.map((c) => `   - ${c._id}: ${c.name}`).join('\n')}
	3. Đề xuất 5-10 tags (từ khóa tiếng Việt) phù hợp để tìm kiếm sản phẩm này


	Trả về kết quả dạng JSON như sau:
	{
		"category_id": "ID của danh mục phù hợp nhất",
		"category_name": "Tên danh mục",
		"confidence": 0.95,
		"tags": ["tag1", "tag2", "tag3", ...],
	}`;

      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      };

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [imagePart, prompt],
      });

      this.logger.debug(`Gemini response: ${response.text}`);
      const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid JSON response from Gemini');
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        suggestedCategory: {
          _id: parsed.category_id,
          name: parsed.category_name,
          confidence: parsed.confidence || 0.5,
        },
        suggestedTags: parsed.tags || [],
      };
    } catch (error) {
      this.logger.error(`Error analyzing image: ${error.message}`, error.stack);
      return {
        suggestedCategory: null,
        suggestedTags: [],
      };
    }
  }

  async analyzeMultipleImages(
    images: Array<{ base64: string; mimeType: string }>,
  ): Promise<ImageAnalysisResult> {
    try {
      const categories = await this.categoryModel.find().exec();
      const categoryList = categories.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
      }));

      const prompt = `
	Bạn là một AI chuyên phân tích hình ảnh để phân loại sản phẩm trong ứng dụng mua bán đồ cũ Say2Hand.
	Hãy phân tích TẤT CẢ các hình ảnh này (nhiều góc nhìn của cùng một sản phẩm) và:
	1. Xác định đối tượng chính trong các ảnh
	2. Chọn danh mục phù hợp nhất từ danh sách sau (trả về _id và name):
	${categoryList.map((c) => `   - ${c._id}: ${c.name}`).join('\n')}
	3. Đề xuất 5-10 tags (từ khóa tiếng Việt) phù hợp để tìm kiếm sản phẩm này, dựa trên TẤT CẢ các ảnh


	Trả về kết quả dạng JSON như sau:
	{
		"category_id": "ID của danh mục phù hợp nhất",
		"category_name": "Tên danh mục",
		"confidence": 0.95,
		"tags": ["tag1", "tag2", "tag3", ...],
	}`;

      // Tạo mảng các imageParts từ tất cả ảnh
      const imageParts = images.map((img) => ({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType,
        },
      }));

      // Gửi tất cả ảnh cùng lúc cho Gemini
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [...imageParts, prompt],
      });

      this.logger.debug(`Gemini multi-image response: ${response.text}`);
      const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid JSON response from Gemini');
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        suggestedCategory: {
          _id: parsed.category_id,
          name: parsed.category_name,
          confidence: parsed.confidence || 0.5,
        },
        suggestedTags: parsed.tags || [],
      };
    } catch (error) {
      this.logger.error(
        `Error analyzing multiple images: ${error.message}`,
        error.stack,
      );
      return {
        suggestedCategory: null,
        suggestedTags: [],
      };
    }
  }
}
