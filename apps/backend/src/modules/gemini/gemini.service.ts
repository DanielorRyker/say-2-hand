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
  // simple in-memory caches to avoid repeated AI calls
  private imageAnalysisCache: Map<
    string,
    { ts: number; result: ImageAnalysisResult }
  > = new Map();
  private addressCache: Map<string, { ts: number; result: any }> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

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

  async normalizeVietnameseAddress(rawAddress: string): Promise<{
    normalized: string;
    detail_address: string;
    ward: string;
    district: string;
    province: string;
    confidence: number;
  }> {
    try {
      // cache key based on rawAddress (can be extended with lat/lon if provided in future)
      const cacheKey = `addr:${rawAddress}`;
      const cached = this.addressCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
        this.logger.debug(`Address cache hit for key=${cacheKey}`);
        return cached.result;
      }
      const prompt = `
Bạn là AI chuyên chuẩn hóa địa chỉ Việt Nam theo cải cách hành chính mới nhất (sau tháng 7/2025).

**CẢI CÁCH HÀNH CHÍNH 07/2025 - TOÀN QUỐC:**
Việt Nam đã xóa bỏ cấp Quận/Huyện/Thành phố trực thuộc, chỉ còn 2 cấp hành chính:
1. Cấp cơ sở: Phường, Xã, Thị trấn
2. Cấp tỉnh: Tỉnh, Thành phố trực thuộc TW

**Cấu trúc địa chỉ mới (toàn quốc):**
[Số nhà, Đường] → [Phường/Xã/Thị trấn] → [Tỉnh/Thành phố]

**Quy tắc chuẩn hóa:**
- XÓA BỎ hoàn toàn: Quận, Huyện, Thành phố trực thuộc (như Thủ Đức, Thuận An, Dĩ An...)
- Quận 1, Quận 2, Quận 9, Quận Thủ Đức... → KHÔNG còn tồn tại
- Huyện Củ Chi, Huyện Nhà Bè... → KHÔNG còn tồn tại
- Chuẩn hóa: "P." → "Phường", "X." → "Xã", "TT." → "Thị trấn"
- Chuẩn hóa: "D." → "Đường", "Đường số" giữ nguyên
- Chuẩn hóa tỉnh: "TP.HCM" → "Thành phố Hồ Chí Minh", "Hà Nội" → "Thành phố Hà Nội"
- Loại bỏ mã bưu chính, ký tự đặc biệt

Địa chỉ cần chuẩn hóa: "${rawAddress}"

Trả về JSON với cấu trúc:
{
  "normalized": "Địa chỉ đã chuẩn hóa (KHÔNG bao gồm Quận/Huyện)",
  "detail_address": "Số nhà và tên đường",
  "ward": "Tên phường/xã/thị trấn",
  "district": "",
  "province": "Tên tỉnh/thành phố",
  "confidence": 0.95
}

**CHÚ Ý:** Trường "district" LUÔN LUÔN để trống "" vì không còn cấp này trong cải cách mới.

**VÍ DỤ:**
Input: "123 Đường Lương Định Của, Phường An Khánh, Quận 2, TP.HCM"
Output: 
{
  "normalized": "123 Đường Lương Định Của, Phường An Khánh, Thành phố Hồ Chí Minh",
  "detail_address": "123 Đường Lương Định Của",
  "ward": "Phường An Khánh",
  "district": "",
  "province": "Thành phố Hồ Chí Minh",
  "confidence": 0.95
}

Input: "Số 5 Đường Trần Phú, Xã Tân Hiệp, Huyện Hóc Môn, TP.HCM"
Output:
{
  "normalized": "5 Đường Trần Phú, Xã Tân Hiệp, Thành phố Hồ Chí Minh",
  "detail_address": "5 Đường Trần Phú",
  "ward": "Xã Tân Hiệp",
  "district": "",
  "province": "Thành phố Hồ Chí Minh",
  "confidence": 0.95
}
`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [prompt],
      });

      this.logger.debug(`Gemini address normalization: ${response.text}`);
      const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid JSON response from Gemini');
      const parsed = JSON.parse(jsonMatch[0]);

      const resultToCache = {
        normalized: parsed.normalized || rawAddress,
        detail_address: parsed.detail_address || '',
        ward: parsed.ward || '',
        district: parsed.district || '',
        province: parsed.province || '',
        confidence: parsed.confidence || 0.5,
      };
      try {
        this.addressCache.set(cacheKey, {
          ts: Date.now(),
          result: resultToCache,
        });
      } catch {
        // ignore cache set failures
      }
      return resultToCache;
    } catch (error) {
      this.logger.error(
        `Error normalizing address: ${error.message}`,
        error.stack,
      );
      return {
        normalized: rawAddress,
        detail_address: '',
        ward: '',
        district: '',
        province: '',
        confidence: 0,
      };
    }
  }

  async analyzeMultipleImages(
    images: Array<{ base64: string; mimeType: string }>,
  ): Promise<ImageAnalysisResult> {
    try {
      // Create a cache key from the beginning of each image payload to avoid storing full base64 as key
      const keyParts = images.map(
        (img) => `${img.mimeType}:${img.base64.slice(0, 64)}`,
      );
      const cacheKey = `img:${keyParts.join('|')}`;
      const cached = this.imageAnalysisCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
        this.logger.debug(`Image analysis cache hit for key=${cacheKey}`);
        return cached.result;
      }
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

      const result = {
        suggestedCategory: {
          _id: parsed.category_id,
          name: parsed.category_name,
          confidence: parsed.confidence || 0.5,
        },
        suggestedTags: parsed.tags || [],
      };
      try {
        this.imageAnalysisCache.set(cacheKey, { ts: Date.now(), result });
      } catch {
        // ignore cache set failures
      }
      return result;
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
