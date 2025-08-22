import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateVerificationTokenDto {
    @IsNotEmpty()
    @IsString()
    user_id: String;
    
    @IsString()
    type: string;
    
    @IsString()
    token_hash: string;
    
    @IsNotEmpty()
    @Type(() => Date) // giúp transform string -> Date
    @IsDate()
    expires_at: Date;
    
    @IsBoolean()
    consumed?: boolean = false; 
}
