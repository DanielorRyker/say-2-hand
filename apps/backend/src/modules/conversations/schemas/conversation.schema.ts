import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({
    type: {
      _id: false, // Tắt tự động tạo _id
      text: { type: String },
      sender_id: { type: Types.ObjectId, ref: 'User' },
      created_at: { type: Date, default: Date.now },
    },
    default: null,
  })
  last_message: {
    text: string;
    sender_id: Types.ObjectId;
    created_at: Date;
  };

  @Prop({ type: String, required: true, unique: true })
  conversation_key: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Thêm các index để tối ưu hiệu suất truy vấn
ConversationSchema.index({ post_id: 1 }); // Index cho tra cứu cuộc hội thoại theo bài đăng
ConversationSchema.index({ participants: 1 }); // Index multikey cho tra cứu cuộc hội thoại theo người tham gia
// conversation_key đã có unique: true trong @Prop, không cần index riêng
ConversationSchema.index({ 'last_message.created_at': -1 }); // Index cho sắp xếp theo thời gian tin nhắn cuối
// Index kết hợp cho truy vấn phổ biến: tìm cuộc hội thoại của người dùng và sắp xếp theo hoạt động gần đây
ConversationSchema.index({ participants: 1, 'last_message.created_at': -1 });
