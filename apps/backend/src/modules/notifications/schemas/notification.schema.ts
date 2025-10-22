import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver_id: Types.ObjectId; // người nhận

   @Prop({ type: Types.ObjectId, ref: 'User'})
  sender_id?: Types.ObjectId; // người nhận

  @Prop({ required: true })
  title: string; // tiêu đề thông báo

  @Prop({ required: true })
  body: string; // nội dung thông báo

  @Prop({
    required: true,
    enum: ['message', 'like', 'new_post', 'transaction', 'moderation', 'system'],
  })
  type: string; // loại thông báo

  @Prop({ type: Types.ObjectId, required: false })
  related_id?: Types.ObjectId; // id linh hoạt: post/conversation/transaction/report

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
