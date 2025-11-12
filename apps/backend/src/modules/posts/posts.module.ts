import { Module, forwardRef } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post, PostSchema } from './schemas/post.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [
    forwardRef(() => ConversationsModule),
    forwardRef(() => MessagesModule),
    forwardRef(() => NotificationsModule),
    GeminiModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema, collection: 'posts' },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
