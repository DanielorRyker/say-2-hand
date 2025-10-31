import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Rating, RatingSchema } from './schemas/rating.schema';
import { User, UserSchema } from '../users/schemas/users.schema';

@Module({
  imports: [
      MongooseModule.forFeature([
        { name: Rating.name, schema: RatingSchema, collection: 'ratings' },
        { name: User.name, schema: UserSchema , collection: 'users' },
      ]),
    ],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
