import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsMongoId,
  IsString,
  IsDate,
  IsBoolean,
} from 'class-validator';

export class CreatePasswordResetDto {
  @IsNotEmpty()
  @IsMongoId()
  user_id: string;

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
