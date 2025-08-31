import { Type } from "class-transformer";
import {  ArrayMinSize, IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
class LocationDto {
  @IsEnum(['Point'])
  @IsOptional()
  type?: 'Point' = 'Point';

  @IsArray()
  @ArrayMinSize(2, { message: 'coordinates phải có đủ [lng, lat]' })
  @IsNumber({}, { each: true })
  @IsOptional()
  coordinates?: [number, number];

  @IsString()
  @IsOptional()
  address?: string;
}

export class CreatePostDto {
      @IsNotEmpty()
        @IsMongoId()
      author_id: string;
    
     @IsNotEmpty()
     @IsMongoId()
      category_id: string;
    
      @IsNotEmpty()
      @IsString()
      title: string;

      @IsOptional()
      @Type(() => Number)       // 👈 ép kiểu
      @IsNumber()
      price?: number;

    
      @IsString()
      description: string;
    
      @IsString()
      condition: string;
    
      @IsString()
      transaction_type : string;

      @IsOptional()
      @IsString()
      status?: string;

      @IsString()
      image: string;
    
    //  @IsOptional()
    // @ValidateNested()
    // @Type(() => LocationDto)
    // location?: LocationDto;

}
