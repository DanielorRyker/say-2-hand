import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchPostDto {
  @IsOptional()
  @IsString()
  q?: string; // Từ khóa tìm kiếm (hỗ trợ tiếng Việt có/không dấu)

  @IsOptional()
  @IsString()
  category_id?: string; // Lọc theo category

  @IsOptional()
  @IsString()
  transaction_type?: string; // sell, exchange, give away

  @IsOptional()
  @IsString()
  condition?: string; // new, like_new, used, etc.

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number; // Giá tối thiểu

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number; // Giá tối đa

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]; // Lọc theo tags

  @IsOptional()
  @IsString()
  province?: string; // Lọc theo tỉnh/thành phố

  @IsOptional()
  @IsString()
  status?: string; // pending_approval, active, completed, etc.

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number; // Trang hiện tại (mặc định = 1)

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number; // Số kết quả mỗi trang (mặc định = 20)

  @IsOptional()
  @IsString()
  sort_by?: string; // createdAt, price, distance (mặc định = createdAt)

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc'; // Thứ tự sắp xếp (mặc định = desc)
}

export class GeoSearchPostDto extends SearchPostDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number; // Vĩ độ vị trí hiện tại

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number; // Kinh độ vị trí hiện tại

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_distance?: number; // Bán kính tìm kiếm tính bằng km (mặc định = 50km)
}
