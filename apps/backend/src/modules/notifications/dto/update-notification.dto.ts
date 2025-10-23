import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationDto } from './create-notification.dto';
import { IsString, IsOptional, IsMongoId, IsBoolean, IsEnum } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
    @IsString()
     @IsOptional()
    title?: string;

    @IsString()
     @IsOptional()
    body?: string;

    @IsString()
    @IsEnum(['message', 'like', 'new_post', 'transaction', 'moderation', 'system'])
    type: string;

    @IsMongoId()
    @IsOptional()
    related_id?: Types.ObjectId;

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
