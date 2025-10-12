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
  @IsOptional()
  @IsEnum(['Point'])
  type?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates?: [number, number]; // [lng, lat]
}

class LocationDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  geo?: GeoPointDto;
}

class ImageDto {
  @IsOptional()
  @IsString()
  url?: string;

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

export class UpdatePostDto {
  @IsOptional()
  @IsMongoId()
  author_id?: string;

  @IsOptional()
  @IsMongoId()
  category_id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];

  @IsOptional()
  @IsEnum(['new', 'used'])
  condition?: 'new' | 'used';

  @IsOptional()
  @IsEnum(['sell', 'exchange', 'give away'])
  transaction_type?: 'sell' | 'exchange' | 'give away';

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

  @IsOptional()
  @IsEnum(['pending_approval', 'active', 'rejected', 'deleted', 'completed'])
  status?: 'pending_approval' | 'active' | 'rejected' | 'deleted' | 'completed';
}
