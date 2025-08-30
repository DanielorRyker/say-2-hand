import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;
@Schema({
  timestamps: true,
  collection: 'posts',
})
export class Category {

}

export const CategorySchema = SchemaFactory.createForClass(Category);
