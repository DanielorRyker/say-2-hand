import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsBoolean, IsEnum } from 'class-validator';
import { Types } from 'mongoose';

export class CreateNotificationDto {
  @IsMongoId()
  @IsNotEmpty()
  receiver_id: Types.ObjectId;

  @IsMongoId()
  @IsOptional()
  sender_id?: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsEnum(['message', 'like', 'new_post', 'transaction', 'moderation', 'system'])
  type: string;

  @IsMongoId()
  @IsOptional()
  related_id?: Types.ObjectId;

  @IsString()
  @IsOptional()
  related_model?: string;

  @IsString()
  @IsOptional()
  deeplink?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsEnum(['in_app', 'push'])
  @IsOptional()
  channel?: string = 'in_app';

  @IsBoolean()
  @IsOptional()
  is_read?: boolean = false;
}
