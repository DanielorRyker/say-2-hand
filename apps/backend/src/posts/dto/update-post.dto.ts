import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import {  ArrayMinSize, IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

class LocationDto {
  @IsEnum(['Point'])
  @IsOptional()
  type?: 'Point'; // <-- bỏ default ở đây

  @IsArray()
  @ArrayMinSize(2, { message: 'coordinates phải có đủ [lng, lat]' })
  @IsNumber({}, { each: true })
  @IsOptional()
  coordinates?: [number, number];


}

export class UpdatePostDto extends PartialType(CreatePostDto) {
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
    
          @IsString()
          @IsOptional()
          address?: string;
        
         @IsOptional()
        @ValidateNested()
        @Type(() => LocationDto)
        location?: LocationDto;
    
}
