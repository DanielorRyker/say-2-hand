import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationDocument, Notification } from './schemas/notification.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class NotificationsService {
  constructor(
     @InjectModel(Notification.name)
      private notificationModel: Model<NotificationDocument>,
  ){}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    // đảm bảo ObjectId hợp lệ
    const notification = new this.notificationModel({
      ...createNotificationDto,
      receiver_id: new Types.ObjectId(createNotificationDto.receiver_id),
      related_id: createNotificationDto.related_id
        ? new Types.ObjectId(createNotificationDto.related_id)
        : undefined,
      sender_id:createNotificationDto.sender_id ?new Types.ObjectId(createNotificationDto.sender_id): undefined,
      is_read: createNotificationDto.is_read ?? false,
      channel: createNotificationDto.channel ?? 'in_app',
    });

    return await notification.save();
  }
  findAll() {
    return this.notificationModel.find();
  }

  findByUserId(userId: string){
    return this.notificationModel
    .find({receiver_id: new Types.ObjectId(userId)})
    .sort({ updatedAt: -1 })
    .exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`;
  }

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
