import { IsEmail, IsNotEmpty, IsOptional, IsNumber, IsString } from "class-validator";

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
  avatar_url?: string;

  @IsOptional()
  @IsString()
  address_text?: string;

 
}
