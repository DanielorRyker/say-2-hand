import { PartialType } from '@nestjs/mapped-types';
import { CreateVerificationTokenDto } from './create-verification_token.dto';
import { IsBoolean, IsDate, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVerificationTokenDto extends PartialType(CreateVerificationTokenDto) {

    
    @IsString()
    type: string;
    
    @IsString()
    token_hash: string;
    
    @IsNotEmpty()
    @Type(() => Date) 
    @IsDate()
    expiresAt: Date;
    
    @IsBoolean()
    consumed?: boolean = false; 
}
