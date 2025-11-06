import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import type {
  CustomField,
  GeminiPart,
  AddressCacheItem,
} from '../../common/types';

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
  private addressCache: Map<string, AddressCacheItem> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour
  private readonly MAX_RETRIES = 5; // Số lần thử lại tối đa
  private readonly RETRY_DELAY = 2000; // Độ trễ giữa các lần thử lại (ms)
  private readonly BACKOFF_MULTIPLIER = 2; // Hệ số tăng độ trễ

  constructor(
    private configService: ConfigService,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {
    this.ai = new GoogleGenAI({});
    this.logger.log('Gemini AI initialized');
  }

  /**
   * Hàm helper để thực hiện retry với exponential backoff
   * @param fn - Hàm async cần thực hiện
   * @param retries - Số lần thử lại còn lại
   * @param delay - Độ trễ hiện tại (ms)
   * @returns Kết quả từ hàm fn
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
    delay: number = this.RETRY_DELAY,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Kiểm tra nếu là lỗi overload hoặc unavailable
      const isRetryableError =
        error?.message?.includes('overloaded') ||
        error?.message?.includes('UNAVAILABLE') ||
        error?.message?.includes('503') ||
        error?.message?.includes('429'); // Rate limit

      if (retries > 0 && isRetryableError) {
        this.logger.warn(
          `API bị quá tải, thử lại sau ${delay}ms (còn ${retries} lần)...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryWithBackoff(
          fn,
          retries - 1,
          delay * this.BACKOFF_MULTIPLIER,
        );
      }

      // Nếu hết số lần thử hoặc lỗi không thể retry, throw error
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
      // Log chi tiết lỗi cho debugging
      this.logger.error(
        `Error analyzing image: ${JSON.stringify({
          message: error.message,
          code: error?.code,
          status: error?.status,
        })}`,
        error.stack,
      );

      // Kiểm tra nếu là lỗi overload sau khi đã retry hết
      if (
        error?.message?.includes('overloaded') ||
        error?.message?.includes('UNAVAILABLE') ||
        error?.message?.includes('503')
      ) {
        this.logger.warn(
          'Gemini API vẫn quá tải sau nhiều lần thử lại. Trả về kết quả mặc định.',
        );
      }

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

      // Gửi tất cả ảnh cùng lúc cho Gemini với retry logic
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
    } catch (error) {
      // Log chi tiết lỗi cho debugging
      this.logger.error(
        `Error analyzing multiple images: ${JSON.stringify({
          message: error.message,
          code: error?.code,
          status: error?.status,
        })}`,
        error.stack,
      );

      // Kiểm tra nếu là lỗi overload sau khi đã retry hết
      if (
        error?.message?.includes('overloaded') ||
        error?.message?.includes('UNAVAILABLE') ||
        error?.message?.includes('503')
      ) {
        this.logger.warn(
          'Gemini API vẫn quá tải sau nhiều lần thử lại. Trả về kết quả mặc định.',
        );
      }

      return {
        suggestedCategory: null,
        suggestedTags: [],
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
   * Tạo custom fields tự động cho một danh mục bằng AI
   * @param categoryId - ID của danh mục
   * @param categoryName - Tên danh mục
   * @returns Danh sách các custom fields được AI đề xuất
   */
  async generateCustomFields(
    categoryId: string,
    categoryName: string,
  ): Promise<any[]> {
    try {
      this.logger.log(
        `Generating custom fields for category: ${categoryName} (${categoryId})`,
      );

      // ✅ BƯỚC 1: Kiểm tra xem đã có schema trong DB chưa
      const category = await this.categoryModel.findById(categoryId).exec();
      if (
        category?.custom_fields_schema &&
        category.custom_fields_schema.length > 0
      ) {
        this.logger.log(
          `Using cached custom fields schema from database for ${categoryName}`,
        );
        return category.custom_fields_schema;
      }

      // ✅ BƯỚC 2: Nếu chưa có, gọi AI để tạo mới
      this.logger.log(`No cached schema found, generating with AI...`);

      // Tạo prompt để AI sinh custom fields phù hợp
      const prompt = `
Bạn là một AI chuyên tạo form nhập liệu cho ứng dụng mua bán đồ cũ Say2Hand.
Danh mục hiện tại: **${categoryName}**

Hãy đề xuất 3-8 trường thông tin bổ sung (custom fields) phù hợp với danh mục này.

**QUY TẮC BẮT BUỘC:**
1. "name" phải là tiếng Anh, viết thường, dùng dấu gạch dưới (snake_case)
2. "label" BẮT BUỘC phải là TIẾNG VIỆT, ngắn gọn, dễ hiểu
3. "placeholder" (nếu có) cũng phải là TIẾNG VIỆT
4. "options" (nếu có) phải là TIẾNG VIỆT
5. Chỉ tạo các field thực sự hữu ích cho người mua/bán
6. Ưu tiên các thông tin quan trọng, dễ điền

**Các loại field hỗ trợ:**
- "text": Nhập văn bản tự do
- "number": Nhập số (giá trị, kích thước, v.v.)
- "select": Chọn một giá trị từ danh sách
- "checkbox": Có/Không
- "radio": Chọn một trong nhiều option

**Ví dụ 1 - Danh mục "Điện thoại":**
\`\`\`json
[
  {
    "name": "brand",
    "label": "Hãng",
    "type": "select",
    "options": ["Apple", "Samsung", "Oppo", "Xiaomi", "Vivo", "Realme"],
    "required": true,
    "placeholder": ""
  },
  {
    "name": "storage",
    "label": "Dung lượng",
    "type": "select",
    "options": ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"],
    "required": false,
    "placeholder": ""
  },
  {
    "name": "battery_health",
    "label": "Tình trạng pin",
    "type": "number",
    "required": false,
    "placeholder": "Ví dụ: 85%"
  },
  {
    "name": "warranty",
    "label": "Còn bảo hành",
    "type": "checkbox",
    "required": false,
    "placeholder": ""
  },
  {
    "name": "color",
    "label": "Màu sắc",
    "type": "text",
    "required": false,
    "placeholder": "Ví dụ: Đen, Trắng"
  }
]
\`\`\`

**Ví dụ 2 - Danh mục "Trái cây":**
\`\`\`json
[
  {
    "name": "fruit_type",
    "label": "Loại trái cây",
    "type": "select",
    "options": ["Đào", "Táo", "Cam", "Xoài", "Dâu", "Nho"],
    "required": true,
    "placeholder": ""
  },
  {
    "name": "origin",
    "label": "Xuất xứ",
    "type": "select",
    "options": ["Việt Nam", "Trung Quốc", "Thái Lan", "Mỹ", "Úc", "Nhật Bản"],
    "required": false,
    "placeholder": ""
  },
  {
    "name": "freshness",
    "label": "Độ tươi",
    "type": "select",
    "options": ["Rất tươi", "Tươi", "Còn tốt"],
    "required": false,
    "placeholder": ""
  },
  {
    "name": "weight_per_fruit",
    "label": "Trọng lượng mỗi quả (g)",
    "type": "number",
    "required": false,
    "placeholder": "Ví dụ: 100"
  },
  {
    "name": "sweetness_estimate",
    "label": "Độ ngọt ước tính",
    "type": "select",
    "options": ["Ngọt vừa", "Rất ngọt", "Ít ngọt"],
    "required": false,
    "placeholder": ""
  },
  {
    "name": "color",
    "label": "Màu sắc",
    "type": "text",
    "required": false,
    "placeholder": "Ví dụ: Hồng cam, Xanh"
  }
]
\`\`\`

**Ví dụ 3 - Danh mục "Xe máy":**
\`\`\`json
[
  {
    "name": "brand",
    "label": "Hãng xe",
    "type": "select",
    "options": ["Honda", "Yamaha", "Suzuki", "SYM", "Piaggio", "Vespa"],
    "required": true,
    "placeholder": ""
  },
  {
    "name": "engine_capacity",
    "label": "Dung tích xi-lanh (cc)",
    "type": "select",
    "options": ["50cc", "110cc", "125cc", "150cc", "160cc", "Trên 160cc"],
    "required": false,
    "placeholder": ""
  },
  {
    "name": "mileage",
    "label": "Số km đã đi",
    "type": "number",
    "required": false,
    "placeholder": "Ví dụ: 15000"
  },
  {
    "name": "registration_status",
    "label": "Tình trạng đăng ký",
    "type": "select",
    "options": ["Đầy đủ", "Thiếu hồ sơ", "Chưa đăng ký"],
    "required": false,
    "placeholder": ""
  }
]
\`\`\`

**LƯU Ý QUAN TRỌNG:**
- MỌI "label" phải là TIẾNG VIỆT
- MỌI "options" phải là TIẾNG VIỆT
- MỌI "placeholder" phải là TIẾNG VIỆT
- Chỉ có "name" là tiếng Anh

**Hãy tạo custom fields cho danh mục "${categoryName}":**
Trả về JSON array theo định dạng trên, KHÔNG thêm giải thích, KHÔNG thêm markdown code block.`;

      const response = await this.retryWithBackoff(async () => {
        return await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
      });

      this.logger.debug(`Gemini custom fields response: ${response.text}`);

      // Parse JSON từ response
      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.warn(
          `Invalid JSON response from Gemini for category ${categoryName}`,
        );
        return this.getDefaultCustomFields(categoryName);
      }

      const fields = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!Array.isArray(fields) || fields.length === 0) {
        this.logger.warn(
          `Empty or invalid fields array for category ${categoryName}`,
        );
        return this.getDefaultCustomFields(categoryName);
      }

      // Validate và sanitize mỗi field
      const validFieldTypes = ['text', 'number', 'select', 'checkbox', 'radio'];

      interface RawField {
        name?: string;
        label?: string;
        type?: string;
        value?: string | number;
        options?: string[];
        required?: boolean;
      }

      const validFields = (fields as RawField[])
        .filter((f) => {
          // Kiểm tra các thuộc tính bắt buộc
          if (!f.name || typeof f.name !== 'string') return false;
          if (!f.label || typeof f.label !== 'string') return false;
          if (!f.type || typeof f.type !== 'string') return false;
          if (!validFieldTypes.includes(f.type)) return false;

          // Validate field name (chỉ chấp nhận a-z, 0-9, underscore)
          if (!/^[a-z][a-z0-9_]*$/i.test(String(f.name))) {
            this.logger.warn(
              `Invalid field name "${f.name}" - must be alphanumeric with underscores`,
            );
            return false;
          }

          // Validate label length
          if (f.label.length > 100) {
            this.logger.warn(
              `Field label too long: "${f.label}" (max 100 chars)`,
            );
            return false;
          }

          // Validate select/radio có options
          if (
            (f.type === 'select' || f.type === 'radio') &&
            !Array.isArray(f.options)
          ) {
            this.logger.warn(
              `Field "${f.name}" of type "${f.type}" must have options array`,
            );
            return false;
          }

          // Validate options không rỗng cho select/radio
          if (
            (f.type === 'select' || f.type === 'radio') &&
            (!f.options || f.options.length === 0)
          ) {
            this.logger.warn(
              `Field "${f.name}" of type "${f.type}" must have at least one option`,
            );
            return false;
          }

          return true;
        })
        .map(
          (f): CustomField => ({
            name: f.name!.trim(),
            label: f.label!.trim(),
            value: f.value || '',
            type: f.type as CustomField['type'],
            options: f.options || undefined,
            required: Boolean(f.required),
          }),
        );

      if (validFields.length === 0) {
        this.logger.warn(
          `No valid fields generated for category ${categoryName}`,
        );
        return this.getDefaultCustomFields(categoryName);
      }

      this.logger.log(
        `Successfully generated ${validFields.length} custom fields for ${categoryName}`,
      );

      // ✅ LƯU SCHEMA VÀO DATABASE
      try {
        await this.categoryModel.updateOne(
          { _id: categoryId },
          { $set: { custom_fields_schema: validFields } },
        );
        this.logger.log(
          `Saved custom fields schema to database for category ${categoryId}`,
        );
      } catch (dbError) {
        this.logger.error(
          `Failed to save custom fields schema to DB: ${dbError.message}`,
        );
        // Không throw error, vẫn trả về fields
      }

      return validFields;
    } catch (error) {
      this.logger.error(
        `Error generating custom fields for ${categoryName}: ${error.message}`,
      );
      // Fallback to default fields
      return this.getDefaultCustomFields(categoryName);
    }
  }

  /**
   * Trả về custom fields mặc định khi AI thất bại
   * Dựa trên tên danh mục để đưa ra fields phù hợp
   */
  private getDefaultCustomFields(categoryName: string): CustomField[] {
    const name = categoryName.toLowerCase();

    // Điện tử / Công nghệ
    if (
      name.includes('điện thoại') ||
      name.includes('phone') ||
      name.includes('smartphone')
    ) {
      return [
        {
          name: 'brand',
          label: 'Hãng',
          type: 'text',
          required: true,
          placeholder: 'Ví dụ: Apple, Samsung',
        },
        {
          name: 'storage',
          label: 'Dung lượng',
          type: 'select',
          options: ['32GB', '64GB', '128GB', '256GB', '512GB'],
          required: false,
          placeholder: '',
        },
        {
          name: 'color',
          label: 'Màu sắc',
          type: 'text',
          required: false,
          placeholder: 'Ví dụ: Đen, Trắng',
        },
      ];
    }

    if (
      name.includes('laptop') ||
      name.includes('máy tính') ||
      name.includes('computer')
    ) {
      return [
        {
          name: 'brand',
          label: 'Hãng',
          type: 'text',
          required: true,
          placeholder: 'Ví dụ: Dell, HP, Asus',
        },
        {
          name: 'processor',
          label: 'CPU',
          type: 'text',
          required: false,
          placeholder: 'Ví dụ: Intel i5, AMD Ryzen 5',
        },
        {
          name: 'ram',
          label: 'RAM',
          type: 'select',
          options: ['4GB', '8GB', '16GB', '32GB', '64GB'],
          required: false,
          placeholder: '',
        },
        {
          name: 'storage',
          label: 'Ổ cứng',
          type: 'text',
          required: false,
          placeholder: 'Ví dụ: SSD 256GB',
        },
      ];
    }

    // Xe cộ / Phương tiện
    if (
      name.includes('xe máy') ||
      name.includes('motor') ||
      name.includes('xe đạp') ||
      name.includes('bike')
    ) {
      return [
        {
          name: 'brand',
          label: 'Hãng',
          type: 'text',
          required: true,
          placeholder: 'Ví dụ: Honda, Yamaha',
        },
        {
          name: 'year',
          label: 'Năm sản xuất',
          type: 'number',
          required: false,
          placeholder: 'Ví dụ: 2020',
        },
        {
          name: 'mileage',
          label: 'Số km đã đi',
          type: 'number',
          required: false,
          placeholder: 'Ví dụ: 5000',
        },
      ];
    }

    // Thời trang
    if (
      name.includes('thời trang') ||
      name.includes('quần áo') ||
      name.includes('áo') ||
      name.includes('quần')
    ) {
      return [
        {
          name: 'size',
          label: 'Size',
          type: 'select',
          options: ['S', 'M', 'L', 'XL', 'XXL'],
          required: false,
          placeholder: '',
        },
        {
          name: 'brand',
          label: 'Thương hiệu',
          type: 'text',
          required: false,
          placeholder: 'Ví dụ: Zara, H&M',
        },
        {
          name: 'color',
          label: 'Màu sắc',
          type: 'text',
          required: false,
          placeholder: 'Ví dụ: Đen, Trắng',
        },
      ];
    }

    // Nội thất
    if (name.includes('nội thất') || name.includes('furniture')) {
      return [
        {
          name: 'material',
          label: 'Chất liệu',
          type: 'text',
          required: false,
          placeholder: 'Ví dụ: Gỗ, Nhựa, Kim loại',
        },
        {
          name: 'dimensions',
          label: 'Kích thước (cm)',
          type: 'text',
          required: false,
          placeholder: 'Ví dụ: 120x80x45',
        },
        {
          name: 'color',
          label: 'Màu sắc',
          type: 'text',
          required: false,
          placeholder: 'Ví dụ: Nâu gỗ',
        },
      ];
    }

    // Default generic fields
    return [
      {
        name: 'brand',
        label: 'Thương hiệu',
        type: 'text',
        required: false,
        placeholder: 'Tên thương hiệu (nếu có)',
      },
      {
        name: 'color',
        label: 'Màu sắc',
        type: 'text',
        required: false,
        placeholder: 'Màu sắc chủ đạo',
      },
      {
        name: 'warranty',
        label: 'Còn bảo hành',
        type: 'checkbox',
        required: false,
        placeholder: '',
      },
    ];
  }

  /**
   * Tự động điền các custom fields dựa trên ảnh và mô tả
   * @param categoryName - Tên danh mục
   * @param customFields - Danh sách các custom fields cần điền
   * @param images - Mảng các ảnh (base64)
   * @param description - Mô tả sản phẩm
   * @returns Object chứa giá trị được đề xuất cho mỗi field
   */
  async autoFillCustomFields(
    categoryName: string,
    customFields: CustomField[],
    images: Array<{ base64: string; mimeType?: string }>,
    description: string,
  ): Promise<Record<string, string | number | boolean>> {
    try {
      this.logger.log(
        `Auto-filling custom fields for category: ${categoryName}`,
      );

      // Validate input
      if (!customFields || customFields.length === 0) {
        this.logger.warn('No custom fields to auto-fill');
        return {};
      }

      // Tạo danh sách fields cần điền
      const fieldsDescription = customFields
        .map((f) => {
          let fieldInfo = `- **${f.name}** ("${f.label}"): Loại ${f.type}`;
          if (f.type === 'select' || f.type === 'radio') {
            fieldInfo += `, các giá trị có thể: ${f.options?.join(', ')}`;
          }
          return fieldInfo;
        })
        .join('\n');

      // Chuẩn bị ảnh cho prompt (chỉ lấy tối đa 3 ảnh đầu tiên)
      const imagesToAnalyze = images.slice(0, 3);

      // Tạo prompt cho AI
      const prompt = `
Bạn là AI chuyên phân tích sản phẩm cho ứng dụng mua bán Say2Hand.
Danh mục: **${categoryName}**
Mô tả sản phẩm: "${description || 'Không có mô tả'}"

Dựa trên ảnh và mô tả, hãy tự động điền giá trị cho các trường sau:
${fieldsDescription}

**QUY TẮC QUAN TRỌNG:**
1. Key trong JSON PHẢI là field name (in đậm bên trên), VD: "brand", "storage", "color"
2. Value PHẢI là TIẾNG VIỆT (trừ khi là số hoặc đã có trong options)
3. Chỉ điền những trường mà bạn TỰ TIN có thể xác định từ ảnh/mô tả
4. Nếu không chắc chắn, BỎ QUA trường đó (không điền)
5. Với trường "select" hoặc "radio", CHỈ chọn CHÍNH XÁC từ các giá trị trong danh sách
6. Không bịa đặt thông tin không có trong ảnh/mô tả

**Ví dụ output (JSON):**
\`\`\`json
{
  "brand": "Apple",
  "storage": "128GB",
  "color": "Đen",
  "battery_health": "85"
}
\`\`\`

**CHÚ Ý:**
- Key = field name (tiếng Anh, snake_case)
- Value = giá trị TIẾNG VIỆT (ngoại trừ số, hoặc giá trị trong options)
- Chỉ trả về JSON object, KHÔNG thêm giải thích
- Nếu không phát hiện được thông tin nào, trả về object rỗng: {}

Trả về JSON:`;

      // Tạo parts cho request (text + images)
      const parts: GeminiPart[] = [{ text: prompt }];

      // Thêm ảnh vào parts
      for (const img of imagesToAnalyze) {
        if (img.base64) {
          let mimeType = img.mimeType || 'image/jpeg';
          if (!/^image\/(jpeg|png|webp|gif)$/.test(mimeType)) {
            mimeType = 'image/jpeg';
          }
          parts.push({
            inlineData: {
              data: img.base64,
              mimeType: mimeType,
            },
          });
        }
      }

      // Gọi AI với retry
      const response = await this.retryWithBackoff(async () => {
        return await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: parts,
        });
      });

      this.logger.debug(`Gemini auto-fill response: ${response.text}`);

      // Parse JSON từ response
      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('Invalid JSON response from Gemini for auto-fill');
        return {};
      }

      const filledValues = JSON.parse(jsonMatch[0]);

      // Dictionary để translate field names phổ biến sang tiếng Việt
      const fieldNameTranslations: Record<string, string> = {
        'Food Type': 'food_type',
        'Expiry Date': 'expiry_date',
        'Storage Condition': 'storage_condition',
        'Best Before': 'best_before',
        'Manufacturing Date': 'manufacturing_date',
        'Net Weight': 'net_weight',
        'Gross Weight': 'gross_weight',
        'Package Type': 'package_type',
        'Serving Size': 'serving_size',
      };

      // Validate các giá trị được điền
      const validatedValues: Record<string, any> = {};

      // Kiểm tra filledValues là object trước khi dùng Object.entries
      if (
        filledValues &&
        typeof filledValues === 'object' &&
        !Array.isArray(filledValues)
      ) {
        for (const [fieldName, value] of Object.entries(
          filledValues as Record<string, any>,
        )) {
          // Normalize field name: nếu AI trả về tiếng Anh có space, convert sang snake_case
          let normalizedFieldName = fieldName;

          // Nếu field name có space và viết hoa (như "Food Type"), convert sang snake_case
          if (fieldName.includes(' ')) {
            if (fieldNameTranslations[fieldName]) {
              normalizedFieldName = fieldNameTranslations[fieldName];
            } else {
              // Auto convert: "Food Type" -> "food_type"
              normalizedFieldName = fieldName
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');
            }
            this.logger.debug(
              `Normalized field name: "${fieldName}" -> "${normalizedFieldName}"`,
            );
          }

          const field = customFields.find(
            (f) => f.name === normalizedFieldName,
          );
          if (!field) {
            this.logger.warn(
              `Field "${normalizedFieldName}" (original: "${fieldName}") not found in custom fields`,
            );
            continue;
          }

          // Validate theo type
          if (field.type === 'select' || field.type === 'radio') {
            // Kiểm tra giá trị có trong options không
            if (
              field.options &&
              Array.isArray(field.options) &&
              field.options.includes(value)
            ) {
              validatedValues[normalizedFieldName] = value;
            } else {
              this.logger.warn(
                `Value "${String(value)}" not in options for field "${normalizedFieldName}"`,
              );
            }
          } else if (field.type === 'number') {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              validatedValues[normalizedFieldName] = value; // Giữ dạng string để frontend xử lý
            }
          } else if (field.type === 'checkbox') {
            validatedValues[normalizedFieldName] = Boolean(value);
          } else if (field.type === 'text') {
            if (typeof value === 'string' && value.length > 0) {
              validatedValues[normalizedFieldName] = value;
            }
          }
        }
      }

      this.logger.log(
        `Auto-filled ${Object.keys(validatedValues).length} fields`,
      );
      return validatedValues;
    } catch (error) {
      this.logger.error('Error auto-filling custom fields:', error);
      return {}; // Trả về rỗng nếu có lỗi
    }
  }
}
