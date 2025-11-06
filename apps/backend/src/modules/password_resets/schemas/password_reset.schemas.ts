import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PasswordResetDocument = PasswordReset & Document;

@Schema({
  timestamps: true,
  collection: 'password_resets',
})
export class PasswordReset {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  token_hash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ default: false })
  consumed: boolean;
}
export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);

// Thêm các index để tối ưu hiệu suất truy vấn
PasswordResetSchema.index({ user_id: 1, consumed: 1 }); // Index kết hợp cho tra cứu token reset mật khẩu chưa sử dụng của người dùng
PasswordResetSchema.index({ token_hash: 1 }); // Index cho xác thực token
// TTL Index để tự động xóa token hết hạn sau 24 giờ
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours = 86400 seconds
