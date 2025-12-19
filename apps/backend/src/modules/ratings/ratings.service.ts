 
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Rating, RatingDocument } from './schemas/rating.schema';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/users.schema';

@Injectable()
export class RatingsService {
   constructor(
      @InjectModel(Rating.name) private ratingModel: Model<RatingDocument>,
      @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {}

async create(createRatingDto: CreateRatingDto) {
  try {
    const payload = {
      ...createRatingDto,
      rater_id: new Types.ObjectId(createRatingDto.rater_id),
      ratee_id: new Types.ObjectId(createRatingDto.ratee_id),
      transaction_id: new Types.ObjectId(createRatingDto.transaction_id),
      post_id: new Types.ObjectId(createRatingDto.post_id),
    };

    const newRating = new this.ratingModel(payload);

    // Cập nhật danh tiếng của người được đánh giá
     const userRating = await this.userModel.findById(createRatingDto.ratee_id);
     let total_ratings = 1;
     let total_score = createRatingDto.score;
     if (userRating && userRating['reputation']) {
       total_ratings = (userRating['reputation'].total_ratings || 0) + 1;
       total_score = (userRating['reputation'].total_score || 0) + createRatingDto.score;
     }
    this.userModel.findByIdAndUpdate(createRatingDto.ratee_id, {
      reputation: {
        total_score: total_score,
        total_ratings: total_ratings,
      },
    }).exec();
    return await newRating.save();
  } catch (error) {
    console.error('Error creating rating:', error);
    throw new Error('Không thể tạo đánh giá');
  }
}

  findAll() {
    return this.ratingModel.find().exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} rating`;
  }

 async update(id: string, updateRatingDto: UpdateRatingDto): Promise<Rating> {
    // Kiểm tra ID hợp lệ
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID không hợp lệ');
    }
    const oldRating = await this.ratingModel.findById(id);
    if (!oldRating) {
      throw new NotFoundException('Không tìm thấy rating để cập nhật');
    }
    else{
      try {
          const oldScore = oldRating.score;
          const updatedRating = await this.ratingModel.findByIdAndUpdate(
          id,
          {
            $set: {
              score: updateRatingDto.score,
              comment: updateRatingDto.comment,
            },
          },
          { new: true }, 
        );

     const userRating = await this.userModel.findById(oldRating.ratee_id);

    if (!userRating || !userRating.reputation) {
      throw new NotFoundException('Không tìm thấy người dùng hoặc danh tiếng để cập nhật');
    }

    await this.userModel.findByIdAndUpdate(oldRating.ratee_id, {
       $set: {
          'reputation.total_score': (userRating.reputation.total_score || 0) - oldScore + (updateRatingDto.score || 0),
        },
      }).exec();

      if (!updatedRating) {
        throw new NotFoundException('Không tìm thấy rating sau khi cập nhật');
      }
      return updatedRating as Rating;
      } catch (error) {
        console.error('Error updating rating:', error);
        throw new Error('Không thể cập nhật đánh giá');
      }
    }
   
  }

  async findOneByRaterAndRatee(rater_id: string, ratee_id: string, transaction_id: string): Promise<Rating> {
  if (!Types.ObjectId.isValid(rater_id) || !Types.ObjectId.isValid(ratee_id)) {
    throw new BadRequestException('ID không hợp lệ');
  }

  const rating = await this.ratingModel.findOne({
    rater_id: new Types.ObjectId(rater_id),
    ratee_id: new Types.ObjectId(ratee_id),
    transaction_id: new Types.ObjectId(transaction_id),
  });

  if (!rating) {
    throw new NotFoundException('Không tìm thấy đánh giá cho cặp người dùng này');
  }

  return rating;
}


  remove(id: number) {
    return `This action removes a #${id} rating`;
  }
}
