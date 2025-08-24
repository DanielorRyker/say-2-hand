import { PartialType } from '@nestjs/mapped-types';
import { CreatePasswordResetDto } from './create-password_reset.dto';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsDate, IsBoolean } from 'class-validator';

export class UpdatePasswordResetDto extends PartialType(CreatePasswordResetDto) {
    
        
        @IsString()
        token_hash: string;
        
        @IsNotEmpty()
        @Type(() => Date) 
        @IsDate()
        expiresAt: Date;
        
        @IsBoolean()
        consumed?: boolean = false; 
}
