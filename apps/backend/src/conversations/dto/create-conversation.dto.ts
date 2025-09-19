// conversations/dto/create-conversation.dto.ts
import { IsMongoId, IsNotEmpty,  IsArray } from 'class-validator';

export class CreateConversationDto {
  @IsMongoId()
  @IsNotEmpty()
  post_id: string;

  @IsArray()
  @IsMongoId({ each: true }) // đảm bảo mỗi phần tử trong mảng là MongoId
  @IsNotEmpty()
  participants: string[];

  // @IsString()
  // @IsNotEmpty()
  // conversation_key: string;
}
