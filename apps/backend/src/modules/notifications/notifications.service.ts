import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  NotificationDocument,
  Notification,
} from './schemas/notification.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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

  async findByUserId(userId: string) {
    //  Lấy danh sách thông báo populate theo post
    const notifications = await this.notificationModel
      .find({ receiver_id: new Types.ObjectId(userId) })
      .populate('sender_id')
      .populate('related_id') // populate Post hoặc Transaction
      .sort({ updatedAt: -1 })
      .exec();

    //nếu là Transaction thì populate thêm post_id
    for (const n of notifications) {
      if (n.related_model === 'Transaction') {
        await n.populate({
          path: 'related_id.post_id',
          model: 'Post',
        });
      }
    }

    return notifications;
  }

  async findTransaction(userId: string) {
    const notifications = await this.notificationModel
      .find({ receiver_id: new Types.ObjectId(userId), type: 'transaction' })
      .populate('sender_id')
      .populate('related_id') // populate Post hoặc Transaction
      .sort({ updatedAt: -1 })
      .exec();

    //nếu là Transaction thì populate thêm post_id
    for (const n of notifications) {
      if (n.related_model === 'Transaction') {
        await n.populate({
          path: 'related_id.post_id',
          model: 'Post',
        });
      }
    }

    return notifications;
  }

  async findModeration(userId: string) {
    const notifications = await this.notificationModel
      .find({ receiver_id: new Types.ObjectId(userId), type: 'moderation' })
      .populate('sender_id')
      .populate('related_id') // populate Post hoặc Transaction
      .sort({ updatedAt: -1 })
      .exec();

    //nếu là Transaction thì populate thêm post_id
    for (const n of notifications) {
      if (n.related_model === 'Transaction') {
        await n.populate({
          path: 'related_id.post_id',
          model: 'Post',
        });
      }
    }

    return notifications;
  }

  async findSystem(userId: string) {
    const notifications = await this.notificationModel
      .find({ receiver_id: new Types.ObjectId(userId), type: 'system' })
      .populate('sender_id')
      .populate('related_id') // populate Post hoặc Transaction
      .sort({ updatedAt: -1 })
      .exec();

    //nếu là Transaction thì populate thêm post_id
    for (const n of notifications) {
      if (n.related_model === 'Transaction') {
        await n.populate({
          path: 'related_id.post_id',
          model: 'Post',
        });
      }
    }

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
