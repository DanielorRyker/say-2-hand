import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsIn,
} from 'class-validator';

export class CreateMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  conversation_id: string;

  @IsMongoId()
  @IsNotEmpty()
  sender_id: string;

  @IsString()
  @IsIn(['text', 'image', 'file', 'video', 'system']) // Thêm 'system' cho tin nhắn hệ thống
  @IsOptional()
  type?: string = 'text';

  @IsString()
  @IsOptional()
  text?: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}
