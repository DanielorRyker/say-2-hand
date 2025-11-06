import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  NotificationDocument,
  Notification,
} from './schemas/notification.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    // đảm bảo ObjectId hợp lệ
    const notification = new this.notificationModel({
      ...createNotificationDto,
      receiver_id: new Types.ObjectId(createNotificationDto.receiver_id),
      related_id: createNotificationDto.related_id
        ? new Types.ObjectId(createNotificationDto.related_id)
        : undefined,
      sender_id: createNotificationDto.sender_id
        ? new Types.ObjectId(createNotificationDto.sender_id)
        : undefined,
      is_read: createNotificationDto.is_read ?? false,
      channel: createNotificationDto.channel ?? 'in_app',
    });

    return await notification.save();
  }
  findAll() {
    return this.notificationModel.find();
  }

  // Task 23: Thêm pagination cho findByUserId
  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Notification>> {
    const skip = (page - 1) * limit;

    // Đếm tổng số notifications
    const total = await this.notificationModel.countDocuments({
      receiver_id: new Types.ObjectId(userId),
    });

    // ✅ Sử dụng aggregation để tối ưu N+1 query với pagination
    const notifications = await this.notificationModel.aggregate([
      {
        $match: { receiver_id: new Types.ObjectId(userId) },
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      // Lookup sender
      {
        $lookup: {
          from: 'users',
          localField: 'sender_id',
          foreignField: '_id',
          as: 'sender_id',
        },
      },
      {
        $unwind: {
          path: '$sender_id',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup related_id với dynamic collection dựa vào related_model
      {
        $lookup: {
          from: 'posts',
          let: { relatedId: '$related_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$relatedId', '$_id'] },
                    { $eq: ['Post', '$$ROOT.related_model'] }, // Chỉ match nếu related_model là Post
                  ],
                },
              },
            },
          ],
          as: 'related_post',
        },
      },
      {
        $lookup: {
          from: 'transactions',
          let: { relatedId: '$related_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$relatedId', '$_id'] },
              },
            },
            // Nested lookup để lấy post_id của transaction
            {
              $lookup: {
                from: 'posts',
                localField: 'post_id',
                foreignField: '_id',
                as: 'post_id',
              },
            },
            {
              $unwind: {
                path: '$post_id',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: 'related_transaction',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { relatedId: '$related_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$relatedId', '$_id'] },
              },
            },
          ],
          as: 'related_user',
        },
      },
      // Merge related data vào 1 field duy nhất
      {
        $addFields: {
          related_id: {
            $cond: {
              if: { $eq: ['$related_model', 'Post'] },
              then: { $arrayElemAt: ['$related_post', 0] },
              else: {
                $cond: {
                  if: { $eq: ['$related_model', 'Transaction'] },
                  then: { $arrayElemAt: ['$related_transaction', 0] },
                  else: { $arrayElemAt: ['$related_user', 0] },
                },
              },
            },
          },
        },
      },
      // Loại bỏ các field tạm
      {
        $project: {
          related_post: 0,
          related_transaction: 0,
          related_user: 0,
        },
      },
    ]);

    return createPaginatedResult(
      notifications as Notification[],
      total,
      page,
      limit,
    );
  }

  async findTransaction(userId: string) {
    // ✅ Sử dụng aggregation để tối ưu - copy logic từ findByUserId và thêm filter type
    const notifications = await this.notificationModel.aggregate([
      {
        $match: {
          receiver_id: new Types.ObjectId(userId),
          type: 'transaction',
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender_id',
          foreignField: '_id',
          as: 'sender_id',
        },
      },
      {
        $unwind: {
          path: '$sender_id',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'transactions',
          let: { relatedId: '$related_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$relatedId', '$_id'] },
              },
            },
            {
              $lookup: {
                from: 'posts',
                localField: 'post_id',
                foreignField: '_id',
                as: 'post_id',
              },
            },
            {
              $unwind: {
                path: '$post_id',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: 'related_id',
        },
      },
      {
        $unwind: {
          path: '$related_id',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    return notifications;
  }

  async findModeration(userId: string) {
    // ✅ Sử dụng aggregation để tối ưu
    const notifications = await this.notificationModel.aggregate([
      {
        $match: {
          receiver_id: new Types.ObjectId(userId),
          type: 'moderation',
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender_id',
          foreignField: '_id',
          as: 'sender_id',
        },
      },
      {
        $unwind: {
          path: '$sender_id',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup cho posts (moderation thường liên quan đến posts)
      {
        $lookup: {
          from: 'posts',
          localField: 'related_id',
          foreignField: '_id',
          as: 'related_id',
        },
      },
      {
        $unwind: {
          path: '$related_id',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    return notifications;
  }

  async findSystem(userId: string) {
    // ✅ Sử dụng aggregation để tối ưu
    const notifications = await this.notificationModel.aggregate([
      {
        $match: {
          receiver_id: new Types.ObjectId(userId),
          type: 'system',
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender_id',
          foreignField: '_id',
          as: 'sender_id',
        },
      },
      {
        $unwind: {
          path: '$sender_id',
          preserveNullAndEmptyArrays: true,
        },
      },
      // System notifications có thể không có related_id hoặc liên quan đến nhiều loại
      {
        $lookup: {
          from: 'posts',
          localField: 'related_id',
          foreignField: '_id',
          as: 'related_post',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'related_id',
          foreignField: '_id',
          as: 'related_user',
        },
      },
      {
        $addFields: {
          related_id: {
            $cond: {
              if: { $eq: ['$related_model', 'Post'] },
              then: { $arrayElemAt: ['$related_post', 0] },
              else: { $arrayElemAt: ['$related_user', 0] },
            },
          },
        },
      },
      {
        $project: {
          related_post: 0,
          related_user: 0,
        },
      },
    ]);

    return notifications;
  }

  async readAll(userId: string) {
    return this.notificationModel.updateMany(
      { receiver_id: new Types.ObjectId(userId), is_read: false },
      { $set: { is_read: true } },
    );
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`;
  }

  update(userId: string, updateNotificationDto: UpdateNotificationDto) {
    return this.notificationModel.updateMany(
      { receiver_id: userId },
      {
        ...updateNotificationDto,
      },
    );
  }

  async remove(receiver_id: string, related_id: string) {
    return this.notificationModel.deleteMany({
      receiver_id,
      related_id,
    });
  }
}
