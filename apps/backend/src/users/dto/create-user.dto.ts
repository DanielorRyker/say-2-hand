<<<<<<< HEAD
import { IsEmail, IsNotEmpty, IsOptional, IsNumber, IsString } from "class-validator";
=======
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb

export class CreateUserDto {

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password_hash: string;

 @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
<<<<<<< HEAD
  avatar_url?: string;

  @IsOptional()
  @IsString()
  address_text?: string;
=======
  avatar?: string;

  @IsOptional()
  @IsString()
  address?: string;
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb

 
}
