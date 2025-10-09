import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
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
    const {
      author_id,
      category_id,
      title,
      description,
      images,
      condition,
      transaction_type,
      price,
      location,
      custom_fields,
      tags,
    } = createPostDto;

    // ✅ Validate ObjectIds
    if (!Types.ObjectId.isValid(author_id) || !Types.ObjectId.isValid(category_id)) {
      throw new BadRequestException('Invalid author_id or category_id');
    }

    
    const locationData: any = {};
    if (location) {
      const { address, geo } = location;
      locationData.address = address || '';

      if (geo?.coordinates?.length === 2) {
        locationData.geo = {
          type: 'Point',
          coordinates: geo.coordinates, // [lng, lat]
        };
      }
    }

    // ✅ Tạo document mới
    const newPost = new this.postModel({
      author_id: new Types.ObjectId(author_id),
      category_id: new Types.ObjectId(category_id),
      title,
      description,
      images: images || [],
      condition,
      transaction_type,
      price: price ?? null,
      location: locationData,
      custom_fields: custom_fields || {},
      tags: tags || [],
      status: 'pending_approval',
    });

    return newPost.save();
  }

  


  

  findAll() {
    return this.postModel.find().exec();
  }

  findAllSortOldest() {
    return this.postModel.find().sort({ createdAt: -1 }).exec();
  }

  findAllPending() {
    return this.postModel.find({ status: 'pending' }).exec();
  }

  findAllActive() {
    return this.postModel.find({ status: 'active' }).exec();
  }

  findAllRejected() {
    return this.postModel.find({ status: 'rejected' }).exec();
  }

  findOne(id: number) {
    return this.postModel.findById(id).exec();
  }

  // update(id: string, updatePostDto: UpdatePostDto) {
  //   return this.postModel
  //     .findByIdAndUpdate(id, updatePostDto, { new: true })
  //     .exec();
  // }

  remove(id: string) {
    return this.postModel.findByIdAndDelete(id).exec();
  }

  findByUserId(userId: string) {
    return this.postModel
      .find({ author_id: new Types.ObjectId(userId) })
      .exec();
  }

  async findAllForHome() {
    return this.postModel
      .find({ status: 'active' })
      .populate('author_id', 'full_name avatar') // lấy thông tin user
      .populate('category_id', 'name') // lấy tên category
      .exec();
  }
}
