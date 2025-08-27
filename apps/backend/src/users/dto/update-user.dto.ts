import { IsOptional, IsString, IsEmail , IsBoolean } from 'class-validator';

export class UpdateUserDto {
 @IsOptional()
   @IsString()
   _id?: string;
 
  @IsOptional()
   @IsString()
   full_name?: string;
 
  @IsOptional()
   @IsEmail()
   email?: string;
 
   @IsOptional()
   @IsString()
   password_hash?: string;
 
  @IsOptional()
   @IsString()
   phone_number?: string;
 
   
  @IsOptional()
  @IsString()
  status?: string;
   
  @IsOptional()
   @IsBoolean()
  email_verified?: boolean;
   
  @IsOptional()
   @IsBoolean()
  phone_verified?: boolean;

 @IsOptional()
   @IsString()
   address?: string;

    @IsOptional()
   @IsString()
     description?: string;

   @IsOptional()
   @IsString()
     avatar?: string;
}
