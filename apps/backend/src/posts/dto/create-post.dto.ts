import { Type } from "class-transformer";
import {  ArrayMinSize, IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
class LocationDto {
  @IsEnum(['Point'])
  type: 'Point';

  @IsArray()
  @ArrayMinSize(2) // phải có ít nhất 2 số (lng, lat)
  @IsNumber({}, { each: true })
  coordinates: number[];

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

      @IsNotEmpty()
      @IsNumber()
      price: number;
    
      @IsString()
      description: string;
    
      @IsString()
      condition: string;
    
      @IsString()
      transaction_type : string;

      @IsString()
      status  : string;

      @IsString()
      image: string;
    
      @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto) // cần để class-transformer hiểu
    location?: LocationDto;
}
