import { Module, forwardRef } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { PostsModule } from '../posts/posts.module'; // nếu Conversations có dùng PostsService

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Conversation.name,
        schema: ConversationSchema,
        collection: 'conversations',
      },
    ]),
    forwardRef(() => PostsModule), // chỉ cần nếu có dùng PostsService
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [
    ConversationsService, // ✅ phải có
    MongooseModule,        // ✅ để module khác dùng ConversationModel
  ],
})
export class ConversationsModule {}
