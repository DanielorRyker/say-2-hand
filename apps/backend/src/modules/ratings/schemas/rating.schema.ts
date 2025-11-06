import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ collection: 'ratings', timestamps: true })
export class Rating extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  rater_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ratee_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true })
  transaction_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  score: number;

  @Prop({ type: String, maxlength: 500 })
  comment: string;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

// Thêm các index để tối ưu hiệu suất truy vấn
RatingSchema.index({ ratee_id: 1, score: 1 }); // Index kết hợp cho tính điểm trung bình của người được đánh giá
RatingSchema.index({ rater_id: 1 }); // Index cho tra cứu đánh giá của người đánh giá
RatingSchema.index({ transaction_id: 1 }, { unique: true }); // Index unique cho đảm bảo mỗi giao dịch chỉ có 1 đánh giá
RatingSchema.index({ post_id: 1 }); // Index cho tra cứu đánh giá theo bài đăng
RatingSchema.index({ createdAt: -1 }); // Index cho sắp xếp theo thời gian tạo
