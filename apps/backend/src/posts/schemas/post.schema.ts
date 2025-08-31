import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;
@Schema({ _id: false })
class Location {

  @Prop({ enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number] }) // [lng, lat]
  coordinates?: [number, number];
}

@Schema({
  timestamps: true,
  collection: 'posts',
})
export class Post {
  @Prop({ type: Types.ObjectId, required: true })
  author_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  category_id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ['new','used'] })
  condition: string;

  @Prop({ required: true, enum: ['free','sell'] })
  transaction_type: string;

  @Prop({ required: true, enum: ['pending','active','rejected','deleted'], default: 'pending' })
  status: string;

  @Prop({ required: true })
  image: string;

  @Prop()
  address?: string;

  @Prop({ type: Location })
  location?: Location;
}


export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({ location: '2dsphere' });