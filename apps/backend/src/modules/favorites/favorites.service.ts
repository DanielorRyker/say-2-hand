import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
  ) {}

async create(dto: CreateFavoriteDto): Promise<Favorite> {
    const { user_id, post_id } = dto;

    // 🔍 Kiểm tra xem user đã yêu thích post này chưa
    const existing = await this.favoriteModel.findOne({ user_id, post_id });
    if (existing) {
      throw new ConflictException('Post already favorited by this user');
    }

    // ✅ Tạo bản ghi mới
    const favorite = new this.favoriteModel({
      user_id: new Types.ObjectId(dto.user_id),
      post_id: new Types.ObjectId(dto.post_id),
    });

    return favorite.save();
  }

  findAll() {
    return this.favoriteModel.find().exec();
  }

  findAllByUser(user_id: string) {
    return this.favoriteModel
      .find({ user_id: new Types.ObjectId(user_id) })
      .sort({ created_at: -1 }) // Mới nhất trước
      .exec();
  }
  
async remove(user_id: string, post_id: string): Promise<{ message: string }> {
    const userObjectId = new Types.ObjectId(user_id);
    const postObjectId = new Types.ObjectId(post_id);

    const result = await this.favoriteModel.findOneAndDelete({
      user_id: userObjectId,
      post_id: postObjectId,
    });

    if (!result) {
      throw new NotFoundException('Favorite not found');
    }

    return { message: 'Favorite removed successfully' };
  }

  async findOne(user_id: string, post_id: string): Promise<boolean> {
  const favorite = await this.favoriteModel.findOne({
    user_id: new Types.ObjectId(user_id),
    post_id: new Types.ObjectId(post_id),
  });

  return !!favorite; 
}




}
