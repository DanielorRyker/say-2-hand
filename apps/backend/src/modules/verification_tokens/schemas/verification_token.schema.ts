import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TokenDocument = VerificationToken & Document;

@Schema({
  timestamps: true,
  collection: 'verification_tokens',
})
export class VerificationToken {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ required: true, enum: ['phone', 'email'] }) // có thể thêm enum nếu chỉ có vài loại
  type: string;

  @Prop({ required: true })
  token_hash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ default: false })
  consumed: boolean;
}
export const TokenSchema = SchemaFactory.createForClass(VerificationToken);

// Thêm các index để tối ưu hiệu suất truy vấn
TokenSchema.index({ user_id: 1, type: 1, consumed: 1 }); // Index kết hợp cho tra cứu token chưa sử dụng của người dùng theo loại
TokenSchema.index({ token_hash: 1 }); // Index cho xác thực token
// TTL Index để tự động xóa token hết hạn sau 24 giờ
TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours = 86400 seconds
