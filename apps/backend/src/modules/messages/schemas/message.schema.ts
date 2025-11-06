import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender_id: Types.ObjectId;

  @Prop({ type: String, enum: ['text', 'image', 'file'], default: 'text' })
  type: string;

  @Prop({ type: String })
  text: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  read_by: Types.ObjectId[];

  @Prop({ type: Date, default: Date.now })
  created_at: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Thêm các index để tối ưu hiệu suất truy vấn
MessageSchema.index({ conversation_id: 1, created_at: -1 }); // Index kết hợp cho tra cứu tin nhắn theo cuộc hội thoại và sắp xếp theo thời gian
MessageSchema.index({ sender_id: 1 }); // Index cho tra cứu tin nhắn theo người gửi
MessageSchema.index({ read_by: 1 }); // Index multikey cho tra cứu tin nhắn đã đọc bởi người dùng
