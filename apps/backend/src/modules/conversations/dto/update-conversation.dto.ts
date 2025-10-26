import { Type } from 'class-transformer';
import {
  IsOptional,
  ValidateNested,
  IsString,
  IsMongoId,
} from 'class-validator';

export class LastMessageDto {
  @IsString()
  text: string;

  @IsMongoId()
  sender_id: string;
}

export class UpdateConversationDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LastMessageDto)
  last_message?: LastMessageDto;

  @IsOptional()
  @IsMongoId()
  post_id: string;
}
