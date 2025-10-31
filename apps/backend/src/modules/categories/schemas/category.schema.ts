import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface CategoryDocument extends Category, Document {
  _id: string;
}
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
}

export const CategorySchema = SchemaFactory.createForClass(Category);
