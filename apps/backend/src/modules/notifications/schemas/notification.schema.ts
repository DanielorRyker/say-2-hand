import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver_id: Types.ObjectId; // người nhận

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender_id?: Types.ObjectId; // người nhận

  @Prop({ required: true })
  title: string; // tiêu đề thông báo

  @Prop({ required: true })
  body: string; // nội dung thông báo

  @Prop({
    required: true,
    enum: [
      'message',
      'like',
      'new_post',
      'transaction',
      'moderation',
      'system',
    ],
  })
  type: string; // loại thông báo

  @Prop({
    type: Types.ObjectId,
    required: false,
    refPath: 'related_model', // tên field sẽ chỉ định model tương ứng
  })
  related_id?: Types.ObjectId;

  @Prop({
    type: String,
    required: false,
    enum: ['Post', 'Transaction', 'User'],
  })
  related_model?: string;

  @Prop({ required: false })
  deeplink?: string; // đường dẫn để điều hướng trên web (VD: /chat/:id)

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>; // dữ liệu phụ tuỳ mục đích

  @Prop({ required: true, enum: ['in_app', 'push'], default: 'in_app' })
  channel: string; // loại kênh gửi (web UI hoặc push notification)

  @Prop({ default: false })
  is_read: boolean; // đã đọc hay chưa
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Thêm các index để tối ưu hiệu suất truy vấn
NotificationSchema.index({ receiver_id: 1, is_read: 1, createdAt: -1 }); // Index kết hợp chính cho tra cứu thông báo của người dùng, lọc theo trạng thái đọc và sắp xếp theo thời gian
NotificationSchema.index({ receiver_id: 1, type: 1 }); // Index cho lọc thông báo theo người nhận và loại
NotificationSchema.index({ sender_id: 1 }); // Index cho tra cứu thông báo theo người gửi
NotificationSchema.index({ related_id: 1, related_model: 1 }); // Index kết hợp cho tra cứu thông báo liên quan đến entity cụ thể
NotificationSchema.index({ createdAt: -1 }); // Index cho sắp xếp theo thời gian tạo
