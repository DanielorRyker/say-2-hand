import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class GeoPointDto {
  @IsEnum(['Point'])
  type: string;

  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: [number, number]; // [lng, lat]
}

class LocationDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  detail_address?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  geo?: GeoPointDto;
}

class ImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  ai_score?: number;
}

export class CreatePostDto {
  @IsMongoId()
  author_id: string;

  @IsMongoId()
  category_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images: ImageDto[];

  @IsEnum(['new', 'like_new', 'used', 'minor_flaw', 'for_repair', 'for_parts'])
  condition:
    | 'new'
    | 'like_new'
    | 'used'
    | 'minor_flaw'
    | 'for_repair'
    | 'for_parts';

  @IsEnum(['sell', 'exchange', 'give away'])
  transaction_type: 'sell' | 'exchange' | 'give away';

  @IsOptional()
  @IsNumber()
  price?: number | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
