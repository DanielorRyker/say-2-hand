import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
            @IsOptional()
            @IsString()
            _id?: string;
  
            @IsNotEmpty()
            @IsString()
            name: string;
  
            
            @IsOptional()
            @IsString()
            slug?: string;
}
