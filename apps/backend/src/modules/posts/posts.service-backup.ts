import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post, PostDocument } from './schemas/post.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdatePostDto } from './dto/update-post.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,
    private conversationService: ConversationsService,
    private messageService: MessagesService,
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
    return this.postModel.find()
     .populate('author_id', 'full_name avatar') // lấy thông tin user
      .populate('category_id', 'name') // lấy tên category
    .exec();
  }

  findAllSortOldest() {
    return this.postModel.find().sort({ createdAt: -1 }).exec();
  }

  findAllPending() {
    return this.postModel.find({ status: 'pending_approval' }).exec();
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

  update(id: string, updatePostDto: UpdatePostDto) {
    return this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .exec();
  }

  remove(id: string) {
    return this.postModel.findByIdAndDelete(id).exec();
  }

  findByUserId(userId: string) {
    return this.postModel
      .find({ author_id: new Types.ObjectId(userId) })
      .populate('author_id', 'full_name avatar') // lấy thông tin user
      .populate('category_id', 'name') // lấy tên category
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findAllForHome() {
    return this.postModel
       .find({ status: { $in: ['active', 'completed'] } })
      .populate('author_id', 'full_name avatar') // lấy thông tin user
      .populate('category_id', 'name') // lấy tên category
      .sort({ updatedAt: -1 })
      .exec();
  }

  async removePost(postId: string) {
    // 1️⃣ Kiểm tra xem post có tồn tại không
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // 2️⃣ Tìm tất cả conversation có post_id = postId
    const conversations = await this.conversationService.findByPostId(postId);
     

    if (conversations.length > 0) {
      const conversationIds: Types.ObjectId[] = conversations.map(
          (c) => c._id as Types.ObjectId
        );

      // 3️⃣ Xóa toàn bộ message thuộc những conversation này
      await this.messageService.removeByConversationIds(conversationIds);

      // 4️⃣ Xóa luôn các conversation
      await this.conversationService.removeByIds(conversationIds);
    }

    // 5️⃣ Xóa bài post
    await this.postModel.findByIdAndDelete(postId);

    return { message: 'Post and related conversations/messages deleted successfully' };
  }

  //Tìm theo favories
  async findByIds(ids: string[]): Promise<Post[]> {
  // Chuyển string sang ObjectId để tìm trong MongoDB
  const objectIds = ids.map((id) => new Types.ObjectId(id));

  return this.postModel
    .find({ _id: { $in: objectIds } })
    .populate('author_id', 'full_name avatar') // lấy thông tin user
    .populate('category_id', 'name') // lấy tên category
    .sort({ updatedAt: -1 })
    .exec();
}



}
