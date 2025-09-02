import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, PostDocument } from './schemas/post.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,
  ) {}

 

  async create(createPostDto: CreatePostDto) {
  const { author_id, category_id, price, transaction_type, ...rest } = createPostDto;

  let finalTransactionType = transaction_type;
  if (price === undefined || price === null || price === 0) {
    finalTransactionType = 'free';
  }

  const postData: any = {
    ...rest,
    author_id: new Types.ObjectId(author_id),
    category_id: new Types.ObjectId(category_id),
    price: price,
    transaction_type: finalTransactionType,
  };

  // build location an toàn
  if (createPostDto.location) {
    const { coordinates } = createPostDto.location;
    const location: any = {};
    if (coordinates?.length === 2) {
      location.type = 'Point';
      location.coordinates = coordinates;
    }
    postData.location = location;
}
if (!postData.location || Object.keys(postData.location).length === 0) {
  delete postData.location;
}
console.log('>>> location data:', postData.location);
  const post = await this.postModel.create(postData);
  return { _id: post._id };
}


  findAll() {
    return this.postModel.find().exec();
  }

  findOne(id: number) {
    return this.postModel.findById(id).exec();
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return this.postModel.findByIdAndUpdate(id, updatePostDto, { new: true }).exec();
  }

  remove(id: number) {
    return this.postModel.findByIdAndDelete(id).exec();
  }

  findByUserId(userId: string) {
    return this.postModel.find({ author_id: new Types.ObjectId(userId) }).exec();
  }
}
