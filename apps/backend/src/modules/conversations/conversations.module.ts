import { PostsModule } from '../posts/posts.module';
import { Module, forwardRef } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import { Message, MessageSchema } from '../messages/schemas/message.schema';

import { ChatGateway } from '../../common/socket/chat.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Conversation.name,
        schema: ConversationSchema,
        collection: 'conversations',
      },
      { name: Message.name, schema: MessageSchema },
    ]),
    forwardRef(() => PostsModule),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ChatGateway],
  exports: [ConversationsService],
})
export class ConversationsModule {}
