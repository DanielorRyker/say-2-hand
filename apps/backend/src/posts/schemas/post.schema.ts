import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;
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

  @Prop({ required: true , default: 0})
  price: number;

  @Prop()
  description: string;

  @Prop({ required: true , enum: ['new','used'] })
  condition: string;

  @Prop({ required: true ,enum: ['free','sell'] })
  transaction_type : string;

  @Prop({ required: true ,enum: ['pending','active','rejected','deleted'], default: 'pending' })
  status  : string;

  @Prop({ required: true })
  image: string;


//  @Prop({
//   type: {
//     type: String,
//     enum: ['Point'],
//     default: 'Point'
//   },
//   coordinates: {
//     type: [Number],
//     required: false   // 👈 không bắt buộc
//   },
//   address: { type: String }
// })
// location?: {
//   type: 'Point';
//   coordinates?: [number, number];
//   address?: string;
// };
}

export const PostSchema = SchemaFactory.createForClass(Post);
