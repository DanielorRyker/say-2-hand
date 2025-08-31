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
    const {author_id, category_id,title, price, description,condition,transaction_type,status,image} = createPostDto;
    const post = await this.postModel.create({
      author_id: new Types.ObjectId(author_id),
      category_id: new Types.ObjectId(category_id),
      title,
      price,
      description,
      condition,
      transaction_type,
      status,
      image
    });
    return { _id: post._id };
  }

  findAll() {
    return this.postModel.find().exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
