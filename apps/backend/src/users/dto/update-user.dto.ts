<<<<<<< HEAD
import { IsOptional, IsString, IsEmail, IsNumber, IsBoolean } from 'class-validator';
=======
import { IsOptional, IsString, IsEmail , IsBoolean } from 'class-validator';
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb

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
 
<<<<<<< HEAD
   @IsOptional()
   @IsString()
   avatar_url?: string;
 
   @IsOptional()
   @IsString()
   address_text?: string;

=======
   
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
  @IsOptional()
  @IsString()
  status?: string;
   
  @IsOptional()
   @IsBoolean()
  email_verified?: boolean;
   
  @IsOptional()
   @IsBoolean()
  phone_verified?: boolean;

<<<<<<< HEAD
 
=======
 @IsOptional()
   @IsString()
   address?: string;

    @IsOptional()
   @IsString()
     description?: string;

   @IsOptional()
   @IsString()
     avatar?: string;
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
}
