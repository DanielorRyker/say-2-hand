import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateVerificationTokenDto {
  @IsNotEmpty()
  @IsMongoId()
  user_id: string;

  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  token_hash: string;

  @IsNotEmpty()
  @Type(() => Date) // giúp transform string -> Date
  @IsDate()
  expiresAt: Date;

  @IsBoolean()
  consumed?: boolean = false;
}
