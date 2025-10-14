import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FavoriteDocument = Favorite & Document;

@Schema({ timestamps: true })
export class Favorite extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId;

}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// 🔒 Ràng buộc không cho user lưu trùng post
FavoriteSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

// ⚡ Index tối ưu truy vấn
FavoriteSchema.index({ user_id: 1, post_id: 1, created_at: -1 });
