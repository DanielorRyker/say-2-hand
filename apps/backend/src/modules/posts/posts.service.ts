import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post, PostDocument } from './schemas/post.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdatePostDto } from './dto/update-post.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchPostDto, GeoSearchPostDto } from './dto/search-post.dto';
import { removeVietnameseTones } from '../../common/helpers/text-utils';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,
    private conversationService: ConversationsService,
    private messageService: MessagesService,
    private notificationsService: NotificationsService,
    private geminiService: GeminiService,
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

    const locationData: any = {};
    if (location) {
      const loc = location as any;

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

    // 🤖 Auto-generate tags nếu không có tags hoặc tags rỗng
    let finalTags = tags || [];
    if (!finalTags || finalTags.length === 0) {
      try {
        const generatedTags = await this.geminiService.generateTagsFromText(
          title,
          description,
        );
        finalTags = generatedTags;
        this.logger.log(`Auto-generated tags: ${generatedTags.join(', ')}`);
      } catch (error) {
        this.logger.error(`Failed to auto-generate tags: ${error.message}`);
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
      tags: finalTags,
      status: 'pending_approval',
    });

    return newPost.save();
  }

  findAll() {
    // Tìm tất cả posts, lấy thông tin tác giả chỉ trong 1 query
    // Sử dụng .populate để lấy full_name và avatar_url của author
    // Sử dụng .lean() để trả về plain object, tăng hiệu suất
    return this.postModel
      .find()
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .lean();
    // Đã loại bỏ N+1 query, không còn vòng lặp query user thủ công
  }

  findAllSortOldest() {
    return this.postModel
      .find()
      .sort({ createdAt: -1 })
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .lean();
  }

  findAllPending() {
    return this.postModel
      .find({ status: 'pending_approval' })
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .lean();
  }

  findAllActive() {
    return this.postModel
      .find({ status: 'active' })
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .sort({ updatedAt: -1 })
      .lean();
  }

  findAllRejected() {
    return this.postModel
      .find({ status: 'rejected' })
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .lean();
  }

  findOne(id: string) {
    return this.postModel
      .findById(id)
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .lean();
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
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .sort({ updatedAt: -1 })
      .lean();
  }

  async findAllForHome() {
    return this.postModel
      .find({ status: { $in: ['active'] } })
      .populate('author_id', 'full_name avatar reputation')
      .populate('category_id', 'name')
      .sort({ updatedAt: -1 })
      .lean();
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
  async findByIds(ids: string[]): Promise<Post[]> {
    // Chuyển string sang ObjectId để tìm trong MongoDB
    const objectIds = ids.map((id) => new Types.ObjectId(id));

    return this.postModel
      .find({ _id: { $in: objectIds } })
      .populate('author_id', 'full_name avatar reputation') // lấy thông tin user
      .populate('category_id', 'name') // lấy tên category
      .sort({ updatedAt: -1 })
      .exec();
  }

  /**
   * Return counts of posts grouped by location.province.
   * Result: [{ province: string | null, count: number }, ...]
   */
  async countsByProvince(): Promise<
    Array<{ province: string | null; count: number }>
  > {
    const pipeline = [
      // optionally filter by status if only active posts are wanted
      { $match: { status: { $in: ['active', 'completed'] } } },
      { $group: { _id: '$location.province', count: { $sum: 1 } } },
      { $project: { _id: 0, province: '$_id', count: 1 } },
    ];

    const result = await this.postModel.aggregate(pipeline);
    return result as Array<{ province: string | null; count: number }>;
  }

  /**
   * Full-text search với hỗ trợ tiếng Việt không dấu
   */
  async searchPosts(searchDto: SearchPostDto) {
    try {
      const {
        q,
        category_id,
        transaction_type,
        condition,
        min_price,
        max_price,
        tags,
        province,
        status = 'active',
        page = 1,
        limit = 20,
        sort_by = 'createdAt',
        sort_order = 'desc',
      } = searchDto;

      this.logger.log(`[searchPosts] searchDto: ${JSON.stringify(searchDto)}`);

      const query: any = {};

      // Filter theo status
      if (status) {
        query.status = status;
      }

      // Full-text search với hỗ trợ tiếng Việt không dấu
      if (q && q.trim()) {
        const normalizedQuery = removeVietnameseTones(q.trim());
        const escapedQuery = normalizedQuery.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        );

        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { title_normalized: { $regex: escapedQuery, $options: 'i' } },
          { description_normalized: { $regex: escapedQuery, $options: 'i' } },
          { tags: { $regex: escapedQuery, $options: 'i' } },
        ];
      }

      // Filter theo category
      if (category_id && Types.ObjectId.isValid(category_id)) {
        query.category_id = new Types.ObjectId(category_id);
      }

      // Filter theo transaction_type
      if (transaction_type) {
        query.transaction_type = transaction_type;
      }

      // Filter theo condition
      if (condition) {
        query.condition = condition;
      }

      // Filter theo price range
      if (min_price !== undefined || max_price !== undefined) {
        query.price = {};
        if (min_price !== undefined) {
          query.price.$gte = min_price;
        }
        if (max_price !== undefined) {
          query.price.$lte = max_price;
        }
      }

      // Filter theo tags
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      // Filter theo province
      if (province) {
        query['location.province'] = province;
      }

      // Xác định sort options
      const sortOptions: any = {};
      if (sort_by === 'price') {
        sortOptions.price = sort_order === 'asc' ? 1 : -1;
      } else if (sort_by === 'createdAt') {
        sortOptions.createdAt = sort_order === 'asc' ? 1 : -1;
      } else {
        sortOptions.updatedAt = sort_order === 'asc' ? 1 : -1;
      }

      // Pagination
      const skip = (page - 1) * limit;

      this.logger.log(`[searchPosts] query: ${JSON.stringify(query)}, sort: ${JSON.stringify(sortOptions)}, skip: ${skip}, limit: ${limit}`);

      // Execute query
      const [results, total] = await Promise.all([
        this.postModel
          .find(query)
          .populate('author_id', 'full_name avatar reputation')
          .populate('category_id', 'name')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.postModel.countDocuments(query),
      ]);

      this.logger.log(`[searchPosts] results: ${results.length}, total: ${total}`);

      return {
        data: results,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      this.logger.error(`[searchPosts] ERROR: ${err?.message}`, err?.stack);
      throw err;
    }
  }

  /**
   * Geospatial search - Tìm kiếm posts gần vị trí hiện tại
   */
  async geoSearchPosts(geoSearchDto: GeoSearchPostDto) {
    const {
      lat,
      lng,
      max_distance = 50, // Default 50km
      q,
      category_id,
      transaction_type,
      condition,
      min_price,
      max_price,
      tags,
      province,
      status = 'active',
      page = 1,
      limit = 20,
    } = geoSearchDto;

    // Validate coordinates
    if (lat === undefined || lng === undefined) {
      throw new BadRequestException(
        'Latitude and longitude are required for geo search',
      );
    }

    // Build match query
    const matchQuery: any = {};

    if (status) {
      matchQuery.status = status;
    }

    // Full-text search
    if (q && q.trim()) {
      const normalizedQuery = removeVietnameseTones(q.trim());
      const escapedQuery = normalizedQuery.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );

      matchQuery.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { title_normalized: { $regex: escapedQuery, $options: 'i' } },
        { description_normalized: { $regex: escapedQuery, $options: 'i' } },
        { tags: { $regex: escapedQuery, $options: 'i' } },
      ];
    }

    if (category_id && Types.ObjectId.isValid(category_id)) {
      matchQuery.category_id = new Types.ObjectId(category_id);
    }

    if (transaction_type) {
      matchQuery.transaction_type = transaction_type;
    }

    if (condition) {
      matchQuery.condition = condition;
    }

    if (min_price !== undefined || max_price !== undefined) {
      matchQuery.price = {};
      if (min_price !== undefined) {
        matchQuery.price.$gte = min_price;
      }
      if (max_price !== undefined) {
        matchQuery.price.$lte = max_price;
      }
    }

    if (tags && tags.length > 0) {
      matchQuery.tags = { $in: tags };
    }

    if (province) {
      matchQuery['location.province'] = province;
    }

    // Chỉ tìm posts có location.geo
    matchQuery['location.geo'] = { $exists: true };

    // Build aggregation pipeline với $geoNear
    const pipeline: any[] = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat], // [longitude, latitude]
          },
          distanceField: 'distance', // Trường chứa khoảng cách (tính bằng mét)
          maxDistance: max_distance * 1000, // Chuyển km sang mét
          spherical: true,
          query: matchQuery,
        },
      },
      {
        $addFields: {
          distanceKm: { $divide: ['$distance', 1000] }, // Chuyển mét sang km
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author_id',
          foreignField: '_id',
          as: 'author_id',
        },
      },
      {
        $unwind: {
          path: '$author_id',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category_id',
        },
      },
      {
        $unwind: {
          path: '$category_id',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'author_id.password': 0,
          'author_id.email': 0,
          'author_id.phone': 0,
        },
      },
    ];

    // Count total
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.postModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute aggregation
    const results = await this.postModel.aggregate(pipeline);

    return {
      data: results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tự động generate tags cho post bằng Gemini AI
   */
  async autoGenerateTags(postId: string): Promise<string[]> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Nếu post có images, sử dụng Gemini để phân tích ảnh
    if (post.images && post.images.length > 0) {
      // TODO: Implement image analysis với Gemini
      // const firstImage = post.images[0];
      // const analysis = await this.geminiService.analyzeImage(firstImage.url);
      // return analysis.suggestedTags;
    }

    // Nếu không có ảnh, generate tags từ title và description
    const text = `${post.title} ${post.description}`.toLowerCase();

    // Basic keyword extraction (có thể cải thiện với AI)
    const keywords = text.split(/\s+/).filter((word) => word.length > 3);
    const uniqueKeywords = [...new Set(keywords)].slice(0, 10);

    return uniqueKeywords;
  }
}
