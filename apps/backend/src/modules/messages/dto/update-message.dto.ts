import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateMessageDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}
