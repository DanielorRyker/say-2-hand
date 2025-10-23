import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class BankAccountDto {
  @IsNotEmpty()
  @IsString()
  bank_name: string;

  @IsNotEmpty()
  @IsString()
  account_number: string;

  @IsNotEmpty()
  @IsString()
  account_holder: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

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
  avatar?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date_of_birth?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankAccountDto)
  bank_accounts?: BankAccountDto[];
}
