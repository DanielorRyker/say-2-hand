import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

// Interface CategoryDocument kế thừa Category và Document, không cần khai báo lại _id
export interface CategoryDocument extends Category, Document {}
@Schema({
  timestamps: true,
  collection: 'categories',
})
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop()
  image?: string;

  @Prop()
  icon?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', default: null })
  parent_id?: MongooseSchema.Types.ObjectId | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
