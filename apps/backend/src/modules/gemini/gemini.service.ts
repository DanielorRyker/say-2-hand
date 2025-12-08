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
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  constructor(
    private configService: ConfigService,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {
    this.ai = new GoogleGenAI({});
    this.logger.log('Gemini AI initialized');
  }

  /**
   * Retry logic cho Gemini API calls
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = this.MAX_RETRIES,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (
        retries > 0 &&
        (error.message?.includes('503') ||
          error.message?.includes('UNAVAILABLE'))
      ) {
        this.logger.warn(
          `Gemini API unavailable, retrying... (${this.MAX_RETRIES - retries + 1}/${this.MAX_RETRIES})`,
        );
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            this.RETRY_DELAY * (this.MAX_RETRIES - retries + 1),
          ),
        );
        return this.retryWithBackoff(fn, retries - 1);
      }
      throw error;
    }
  }

  async analyzeImage(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
  ): Promise<ImageAnalysisResult> {
    try {
      const categories = await this.categoryModel
        .find()
        .populate('parent_id', 'name icon')
        .exec();

      // Phân loại danh mục cha và con
      const parentCategories = categories.filter((c) => !c.parent_id);
      const childCategories = categories.filter((c) => c.parent_id);

      const parentList = parentCategories.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        icon: c.icon,
      }));

      const childList = childCategories.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        icon: c.icon,
        parent: {
          _id: (c.parent_id as any)?._id?.toString(),
          name: (c.parent_id as any)?.name,
        },
      }));

      const prompt = `
	Bạn là một AI chuyên phân tích hình ảnh để phân loại sản phẩm trong ứng dụng mua bán đồ cũ Say2Hand.
	Hãy phân tích hình ảnh này và:
	1. Xác định đối tượng chính trong ảnh
	2. **ƯU TIÊN chọn danh mục CON (cụ thể hơn) nếu có**, nếu không có thì chọn danh mục cha
	
	**DANH MỤC CHA (tổng quát):**
	${parentList.map((c) => `   - ${c._id}: ${c.name}${c.icon ? ` [${c.icon}]` : ''}`).join('\n')}
	
	**DANH MỤC CON (cụ thể - ưu tiên):**
	${childList.map((c) => `   - ${c._id}: ${c.name}${c.icon ? ` [${c.icon}]` : ''} (thuộc "${c.parent.name}")`).join('\n')}
	
	3. Đề xuất 5-10 tags (từ khóa tiếng Việt) phù hợp

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

      const response = await this.retryWithBackoff(async () => {
        return await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [imagePart, prompt],
        });
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
        return cached.result;
      }
      const prompt = `
Bạn là AI chuyên chuẩn hóa địa chỉ Việt Nam theo cải cách hành chính mới nhất (sau tháng 7/2025).

**CẢI CÁCH HÀNH CHÍNH 07/2025 - TOÀN QUỐC:**
Việt Nam đã xóa bỏ cấp Quận/Huyện/Thành phố trực thuộc, chỉ còn 2 cấp hành chính:
1. Cấp cơ sở: Phường, Xã, Thị trấn
2. Cấp tỉnh: Tỉnh, Thành phố trực thuộc TW

**SÁP NHẬP TỈNH QUAN TRỌNG:**
- **Bình Dương** → Đã SÁP NHẬP vào **Thành phố Hồ Chí Minh**
- **Thuận An** (trước là thành phố/quận) → Giờ là **Phường Thuận An, TP.HCM**
- **Dĩ An** (trước là thành phố/quận) → Giờ là **Phường Dĩ An, TP.HCM**
- **Phường Thông Tây Hội** (Thuận An cũ) → **Phường Thông Tây Hội, TP.HCM**
- Bất kỳ địa chỉ nào có "Bình Dương" hoặc "Thuận An" → Đều thuộc **TP.HCM**

**Cấu trúc địa chỉ mới (toàn quốc):**
[Số nhà, Đường] → [Phường/Xã/Thị trấn] → [Tỉnh/Thành phố]

**Quy tắc chuẩn hóa:**
- XÓA BỎ hoàn toàn: Quận, Huyện, Thành phố trực thuộc (như Thủ Đức, Thuận An, Dĩ An...)
- Quận 1, Quận 2, Quận 9, Quận Thủ Đức... → KHÔNG còn tồn tại
- Huyện Củ Chi, Huyện Nhà Bè... → KHÔNG còn tồn tại
- **"Bình Dương"** → **"Thành phố Hồ Chí Minh"**
- **"Thuận An"** (khi là thành phố/quận) → **"Phường Thuận An"** hoặc các phường cụ thể như "Phường Thông Tây Hội"
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

Input: "Đường số 3, Phường Thông Tây Hội, Thuận An, Bình Dương"
Output:
{
  "normalized": "Đường số 3, Phường Thông Tây Hội, Thành phố Hồ Chí Minh",
  "detail_address": "Đường số 3",
  "ward": "Phường Thông Tây Hội",
  "district": "",
  "province": "Thành phố Hồ Chí Minh",
  "confidence": 0.95
}
`;

      const response = await this.retryWithBackoff(async () => {
        return await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [prompt],
        });
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

  /**
   * Helper function để tạo hash từ string (giống frontend)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  async analyzeMultipleImages(
    images: Array<{ base64: string; mimeType: string }>,
    forceRefresh: boolean = false,
  ): Promise<ImageAnalysisResult> {
    try {
      // Create cache key từ hash toàn bộ base64 để đảm bảo ảnh khác nhau có key khác nhau
      const keyParts = images.map(
        (img) => `${img.mimeType}:${this.simpleHash(img.base64)}`,
      );
      const cacheKey = `img:${keyParts.join('|')}`;

      // Skip cache if forceRefresh is true
      if (!forceRefresh) {
        const cached = this.imageAnalysisCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
          this.logger.debug(
            `Image analysis cache hit for key=${cacheKey.slice(0, 50)}...`,
          );
          return cached.result;
        }
      } else {
        this.logger.debug('Force refresh requested, skipping cache');
      }

      this.logger.debug(
        `No cache found or force refresh, performing new AI analysis for key=${cacheKey.slice(0, 50)}...`,
      );
      const categories = await this.categoryModel
        .find()
        .populate('parent_id', 'name icon')
        .exec();

      // Phân loại danh mục cha và con
      const parentCategories = categories.filter((c) => !c.parent_id);
      const childCategories = categories.filter((c) => c.parent_id);

      const parentList = parentCategories.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        icon: c.icon,
      }));

      const childList = childCategories.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        icon: c.icon,
        parent: {
          _id: (c.parent_id as any)?._id?.toString(),
          name: (c.parent_id as any)?.name,
        },
      }));

      const prompt = `
	Bạn là một AI chuyên phân tích hình ảnh để phân loại sản phẩm trong ứng dụng mua bán đồ cũ Say2Hand.
	Hãy phân tích TẤT CẢ các hình ảnh này (nhiều góc nhìn của cùng một sản phẩm) và:
	1. Xác định đối tượng chính trong các ảnh
	2. **ƯU TIÊN chọn danh mục CON (cụ thể hơn) nếu có**, nếu không có thì chọn danh mục cha
	
	**DANH MỤC CHA (tổng quát):**
	${parentList.map((c) => `   - ${c._id}: ${c.name}${c.icon ? ` [${c.icon}]` : ''}`).join('\n')}
	
	**DANH MỤC CON (cụ thể - ưu tiên):**
	${childList.map((c) => `   - ${c._id}: ${c.name}${c.icon ? ` [${c.icon}]` : ''} (thuộc "${c.parent.name}")`).join('\n')}
	
	3. Đề xuất 5-10 tags (từ khóa tiếng Việt) phù hợp, dựa trên TẤT CẢ các ảnh

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
      const response = await this.retryWithBackoff(async () => {
        return await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [...imageParts, prompt],
        });
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
    } catch (error: any) {
      this.logger.error(
        `Error analyzing multiple images: ${JSON.stringify(error)}`,
      );

      // Xử lý lỗi quota exceeded
      if (
        error.message?.includes('quota') ||
        error.message?.includes('RESOURCE_EXHAUSTED')
      ) {
        throw {
          statusCode: 429,
          message:
            'Đã vượt quá giới hạn API Gemini (20 requests/ngày). Vui lòng thử lại sau hoặc nâng cấp gói.',
          error: 'QUOTA_EXCEEDED',
        };
      }

      // Xử lý lỗi rate limit
      if (error.message?.includes('rate limit')) {
        throw {
          statusCode: 429,
          message:
            'Đang gửi yêu cầu quá nhanh. Vui lòng đợi 1 phút và thử lại.',
          error: 'RATE_LIMIT',
        };
      }

      // Lỗi khác
      throw {
        statusCode: 500,
        message: 'Không thể phân tích ảnh. Vui lòng thử lại sau.',
        error: error.message || 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Gợi ý icon Iconify phù hợp dựa trên tên danh mục
   * @param categoryName - Tên danh mục cần gợi ý icon
   * @returns Icon name từ Iconify (vd: "mdi:phone", "mdi:laptop")
   */
  async suggestIcon(categoryName: string): Promise<string> {
    try {
      const prompt = `Bạn là một AI chuyên gợi ý icon từ thư viện Iconify.
Dựa vào tên danh mục, hãy gợi ý 1 icon phù hợp nhất.

Tên danh mục: "${categoryName}"

Yêu cầu:
1. Chỉ trả về tên icon từ Iconify (format: prefix:name)
2. Ưu tiên sử dụng các prefix phổ biến: mdi, fa, bi, lucide, heroicons
3. Icon phải rõ ràng, dễ hiểu và phù hợp với tên danh mục
4. Chỉ trả về 1 icon duy nhất, không giải thích

Ví dụ:
- "Điện thoại" → mdi:cellphone
- "Laptop" → mdi:laptop
- "Xe máy" → mdi:motorbike
- "Thời trang" → mdi:tshirt-crew
- "Đồ gia dụng" → mdi:silverware-fork-knife
- "Thú cưng" → mdi:paw
- "Sách" → mdi:book-open-page-variant

Trả về ĐÚNG format: prefix:name`;

      const response = await this.retryWithBackoff(async () => {
        return await this.ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt,
          config: {
            temperature: 0.3, // Giảm nhiệt độ để có kết quả ổn định hơn
            maxOutputTokens: 50,
          },
        });
      });

      const responseText = response.text?.trim() || '';

      // Validate icon format (prefix:name)
      const iconPattern = /^[a-z0-9-]+:[a-z0-9-]+$/i;
      if (iconPattern.test(responseText)) {
        this.logger.log(
          `Icon suggested for "${categoryName}": ${responseText}`,
        );
        return responseText;
      }

      // Fallback nếu format không đúng
      this.logger.warn(
        `Invalid icon format received: ${responseText}, using default`,
      );
      return this.getDefaultIcon(categoryName);
    } catch (error) {
      // Xử lý lỗi quota exhausted (429) hoặc bất kỳ lỗi AI nào
      const errorMessage = error.message || JSON.stringify(error);

      if (
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED')
      ) {
        this.logger.warn(
          `Gemini API quota exhausted for "${categoryName}", using smart fallback`,
        );
      } else {
        this.logger.error(
          `Error suggesting icon for "${categoryName}": ${errorMessage}`,
        );
      }

      // Luôn trả về default icon thay vì throw error
      return this.getDefaultIcon(categoryName);
    }
  }

  /**
   * Trả về icon mặc định dựa trên từ khóa trong tên danh mục
   */
  private getDefaultIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();

    // Map các từ khóa phổ biến với icon (thứ tự từ cụ thể đến chung)
    const iconMap: { [key: string]: string } = {
      // Điện tử & Công nghệ
      'điện thoại': 'mdi:cellphone',
      phone: 'mdi:cellphone',
      smartphone: 'mdi:cellphone-android',
      iphone: 'mdi:apple',
      laptop: 'mdi:laptop',
      'máy tính': 'mdi:laptop',
      computer: 'mdi:desktop-tower',
      tablet: 'mdi:tablet',
      'máy tính bảng': 'mdi:tablet',
      'tai nghe': 'mdi:headphones',
      headphone: 'mdi:headphones',
      camera: 'mdi:camera',
      'máy ảnh': 'mdi:camera',
      tivi: 'mdi:television',
      tv: 'mdi:television',
      'điện tử': 'mdi:chip',
      electronic: 'mdi:chip',

      // Phương tiện
      'xe máy': 'mdi:motorbike',
      motor: 'mdi:motorbike',
      'xe đạp': 'mdi:bicycle',
      bike: 'mdi:bicycle',
      'ô tô': 'mdi:car',
      'xe hơi': 'mdi:car',
      car: 'mdi:car',
      xe: 'mdi:car-side',

      // Thời trang & Phụ kiện
      'thời trang': 'mdi:tshirt-crew',
      'quần áo': 'mdi:tshirt-crew',
      fashion: 'mdi:tshirt-crew',
      áo: 'mdi:tshirt-crew',
      quần: 'mdi:human-handsup',
      giày: 'mdi:shoe-formal',
      shoe: 'mdi:shoe-formal',
      dép: 'mdi:shoe-sneaker',
      'túi xách': 'mdi:bag-personal',
      bag: 'mdi:bag-personal',
      'đồng hồ': 'mdi:watch',
      watch: 'mdi:watch',
      kính: 'mdi:glasses',
      glass: 'mdi:glasses',

      // Nhà cửa & Nội thất
      'nội thất': 'mdi:sofa',
      furniture: 'mdi:sofa',
      bàn: 'mdi:table-furniture',
      table: 'mdi:table-furniture',
      ghế: 'mdi:seat',
      chair: 'mdi:seat',
      giường: 'mdi:bed',
      bed: 'mdi:bed',
      tủ: 'mdi:cupboard',
      cabinet: 'mdi:cupboard',
      đèn: 'mdi:lamp',
      lamp: 'mdi:lamp',
      'đồ gia dụng': 'mdi:home-variant',
      'gia dụng': 'mdi:home-variant',
      nhà: 'mdi:home',
      home: 'mdi:home',

      // Giải trí & Sở thích
      sách: 'mdi:book-open-page-variant',
      book: 'mdi:book-open-page-variant',
      truyện: 'mdi:book-open-variant',
      'đồ chơi': 'mdi:toy-brick',
      toy: 'mdi:toy-brick',
      game: 'mdi:gamepad-variant',
      'thể thao': 'mdi:basketball',
      sport: 'mdi:basketball',
      'nhạc cụ': 'mdi:guitar-acoustic',
      music: 'mdi:music',

      // Làm đẹp & Sức khỏe
      'mỹ phẩm': 'mdi:lipstick',
      cosmetic: 'mdi:lipstick',
      makeup: 'mdi:palette',
      spa: 'mdi:spa',
      'y tế': 'mdi:medical-bag',
      health: 'mdi:heart-pulse',

      // Thú cưng & Động vật
      'thú cưng': 'mdi:paw',
      pet: 'mdi:paw',
      chó: 'mdi:dog',
      dog: 'mdi:dog',
      mèo: 'mdi:cat',
      cat: 'mdi:cat',

      // Khác
      'đồ cũ': 'mdi:recycle',
      cũ: 'mdi:package-variant',
      khác: 'mdi:dots-horizontal',
      other: 'mdi:dots-horizontal',
    };

    // Tìm từ khóa khớp (từ dài đến ngắn để ưu tiên match cụ thể)
    const sortedKeys = Object.keys(iconMap).sort((a, b) => b.length - a.length);
    for (const keyword of sortedKeys) {
      if (name.includes(keyword)) {
        this.logger.log(
          `Default icon matched for "${categoryName}": ${iconMap[keyword]} (keyword: "${keyword}")`,
        );
        return iconMap[keyword];
      }
    }

    // Icon mặc định cuối cùng
    this.logger.log(
      `No match found for "${categoryName}", using default folder icon`,
    );
    return 'mdi:folder';
  }

  /**
   * Tự động generate tags từ title và description của post
   */
  async generateTagsFromText(
    title: string,
    description: string,
  ): Promise<string[]> {
    try {
      const prompt = `
Bạn là AI chuyên phân tích nội dung bài đăng trong ứng dụng mua bán đồ cũ.
Hãy đọc tiêu đề và mô tả bên dưới, sau đó đề xuất 5-10 từ khóa (tags) phù hợp bằng tiếng Việt.

**Yêu cầu:**
- Tags phải ngắn gọn, dễ hiểu (1-3 từ)
- Ưu tiên các từ khóa liên quan đến: thương hiệu, loại sản phẩm, tính năng đặc biệt, tình trạng
- Không trùng lặp
- Chỉ trả về JSON array

**Tiêu đề:** ${title}
**Mô tả:** ${description}

Trả về JSON:
{
  "tags": ["tag1", "tag2", "tag3", ...]
}`;

      const response = await this.retryWithBackoff(async () => {
        return await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [prompt],
        });
      });

      this.logger.debug(`Gemini tags response: ${response.text}`);
      const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('Invalid JSON response from Gemini for tags');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.tags || [];
    } catch (error) {
      this.logger.error(`Error generating tags: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Generate tags từ image analysis (sử dụng kết quả từ analyzeImage)
   */
  async generateTagsFromImage(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
  ): Promise<string[]> {
    try {
      const analysis = await this.analyzeImage(imageBase64, mimeType);
      return analysis.suggestedTags || [];
    } catch (error) {
      this.logger.error(
        `Error generating tags from image: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
