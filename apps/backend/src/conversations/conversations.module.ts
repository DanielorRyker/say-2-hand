import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationSchema ,Conversation} from './schemas/conversation.schema';

@Module({
  imports: [
        MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema, collection: 'conversations' }])
      ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
