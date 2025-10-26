import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ _id: false })
class GeoPoint {
  @Prop({ enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number] }) // [lng, lat]
  coordinates?: [number, number];
}

@Schema({ _id: false })
class Location {
  @Prop()
  address?: string; // địa chỉ chuỗi do user nhập

  @Prop()
  detail_address?: string; // địa chỉ chi tiết

  @Prop()
  ward?: string; // phường

  @Prop()
  province?: string; // tỉnh

  @Prop({ type: GeoPoint })
  geo?: GeoPoint; // GeoJSON Point nếu người dùng chọn trên bản đồ
}

@Schema({
  timestamps: true,
  collection: 'posts',
})
export class Post {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  author_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Category' })
  category_id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: [
      {
        url: { type: String, required: true },
        alt: { type: String },
        tags: { type: [String], default: [] },
        ai_score: { type: Number },
      },
    ],
    default: [],
  })
  images: Array<{
    url: string;
    alt?: string;
    tags?: string[];
    ai_score?: number;
  }>;

  @Prop({
    required: true,
    enum: ['new', 'like_new', 'used', 'minor_flaw', 'for_repair', 'for_parts'],
  })
  condition: string;

  @Prop({ required: true, enum: ['sell', 'exchange', 'give away'] })
  transaction_type: string;

  @Prop({ type: Number, default: null })
  price: number | null;

  @Prop({ type: Location })
  location?: Location;

  @Prop({ type: Object, default: {} })
  custom_fields: Record<string, any>;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    required: true,
    enum: ['pending_approval', 'active', 'completed', 'rejected', 'deleted','shipping'],
    default: 'pending_approval',
  })
  status: string;

  @Prop({
    type: {
      view_count: { type: Number, default: 0 },
      favorite_count: { type: Number, default: 0 },
      chat_count: { type: Number, default: 0 },
    },
    default: {},
  })
  stats: {
    view_count: number;
    favorite_count: number;
    chat_count: number;
  };

  @Prop({
    type: {
      reject_reason: { type: String },
    },
    default: {},
  })
  moderation: {
    reject_reason?: string;
  };

  @Prop()
  completed_at?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Indexes
PostSchema.index({ author_id: 1 });
PostSchema.index({ category_id: 1 });
PostSchema.index({ transaction_type: 1, condition: 1, price: 1 });
PostSchema.index({ status: 1, createdAt: 1 });
// location.geo as 2dsphere for proximity queries
PostSchema.index({ 'location.geo': '2dsphere' }, { sparse: true });
PostSchema.index({ tags: 1 });
// text index for title, description and tags
PostSchema.index({ title: 'text', description: 'text', tags: 'text' });
// partial index to optimize feed — only for active posts
PostSchema.index(
  { createdAt: 1 },
  { partialFilterExpression: { status: 'active' } },
);
