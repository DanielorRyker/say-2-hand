import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post, PostDocument } from './schemas/post.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../common/dto/pagination.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { LocationData } from '../../common/types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,
    private conversationService: ConversationsService,
    private messageService: MessagesService,
    private notificationsService: NotificationsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    if (
      !Types.ObjectId.isValid(author_id) ||
      !Types.ObjectId.isValid(category_id)
    ) {
      throw new BadRequestException('Invalid author_id or category_id');
    }

    const locationData: Partial<LocationData> = {};
    if (location) {
      const loc = location as LocationData;

      locationData.address = loc.address || '';

      if (loc.detail_address) locationData.detail_address = loc.detail_address;
      if (loc.ward) locationData.ward = loc.ward;
      if (loc.province) locationData.province = loc.province;

      if (loc.geo?.coordinates?.length === 2) {
        locationData.geo = {
          type: 'Point',
          coordinates: loc.geo.coordinates, // [lng, lat]
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
    return this.postModel
      .find()
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .exec();
  }

  // Task 24: Optimize với lean()
  findAllSortOldest() {
    return this.postModel
      .find()
      .sort({ createdAt: -1 })
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .lean()
      .exec();
  }

  findAllPending() {
    return this.postModel
      .find({ status: 'pending_approval' })
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .lean()
      .exec();
  }

  findAllActive() {
    return this.postModel
      .find({ status: 'active' })
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  findAllRejected() {
    return this.postModel
      .find({ status: 'rejected' })
      .populate('author_id', 'full_name avatar')
      .populate('category_id', 'name')
      .lean()
      .exec();
  }

  // Task 46: Cache frequently accessed data
  async findOne(id: string) {
    // Check cache first
    const cacheKey = `post:${id}`;
    const cached = await this.cacheManager.get<Post>(cacheKey);

    if (cached) {
      return cached;
    }

    // If not in cache, fetch from database
    const post = await this.postModel
      .findById(id)
      .populate('author_id', 'full_name avatar')
      .populate('category_id', 'name')
      .lean()
      .exec();

    if (post) {
      // Store in cache for 5 minutes
      await this.cacheManager.set(cacheKey, post, 300000);
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    // Invalidate cache khi update
    const cacheKey = `post:${id}`;
    await this.cacheManager.del(cacheKey);

    return this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    // Invalidate cache khi delete
    const cacheKey = `post:${id}`;
    await this.cacheManager.del(cacheKey);

    return this.postModel.findByIdAndDelete(id).exec();
  }

  // Task 23: Thêm pagination cho findByUserId
  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Post>> {
    const skip = (page - 1) * limit;

    // Đếm tổng số documents
    const total = await this.postModel.countDocuments({
      author_id: new Types.ObjectId(userId),
    });

    // Lấy data với pagination
    const data = await this.postModel
      .find({ author_id: new Types.ObjectId(userId) })
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return createPaginatedResult(data as Post[], total, page, limit);
  }

  // Task 23: Thêm pagination cho findAllForHome
  async findAllForHome(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Post>> {
    const skip = (page - 1) * limit;

    const total = await this.postModel.countDocuments({
      status: { $in: ['active'] },
    });

    const data = await this.postModel
      .find({ status: { $in: ['active'] } })
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return createPaginatedResult(data as Post[], total, page, limit);
  }

  async removePost(postId: string) {
    //  Kiểm tra xem post có tồn tại không
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    //  Tìm tất cả conversation có post_id = postId
    const conversations = await this.conversationService.findByPostId(postId);

    if (conversations.length > 0) {
      const conversationIds: Types.ObjectId[] = conversations.map(
        (c) => c._id as Types.ObjectId,
      );

      //  Xóa toàn bộ message thuộc những conversation này
      await this.messageService.removeByConversationIds(conversationIds);

      //  Xóa luôn các conversation
      await this.conversationService.removeByIds(conversationIds);
    }
    // Xóa thông báo liên quan
    // await this.notificationsService.remove(post.author_id.toString(), postId)

    //  Xóa bài post
    await this.postModel.findByIdAndDelete(postId);

    return {
      message: 'Post and related conversations/messages deleted successfully',
    };
  }

  //Tìm theo favories
  // Task 24: Optimize findByIds với lean() và select fields
  async findByIds(ids: string[]): Promise<Post[]> {
    // Chuyển string sang ObjectId để tìm trong MongoDB
    const objectIds = ids.map((id) => new Types.ObjectId(id));

    return this.postModel
      .find({ _id: { $in: objectIds } })
      .populate('author_id', 'full_name avatar') // Chỉ lấy fields cần thiết
      .populate('category_id', 'name')
      .sort({ updatedAt: -1 })
      .lean() // Tối ưu memory
      .exec();
  }

  /**
   * Return counts of posts grouped by location.province.
   * Result: [{ province: string | null, count: number }, ...]
   */
  async countsByProvince(): Promise<
    Array<{ province: string | null; count: number }>
  > {
    // Task 24: Fix TypeScript aggregation typing
    const result = await this.postModel.aggregate([
      // optionally filter by status if only active posts are wanted
      { $match: { status: { $in: ['active', 'completed'] } } },
      { $group: { _id: '$location.province', count: { $sum: 1 } } },
      { $project: { _id: 0, province: '$_id', count: 1 } },
    ]);

    return result as Array<{ province: string | null; count: number }>;
  }
}
