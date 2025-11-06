import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export interface CategoryDocument extends Category, Document {
  _id: string;
}

// Schema cho custom fields (AI-generated)
export interface CustomFieldSchema {
  name: string; // field name (snake_case)
  label: string; // label tiếng Việt
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio';
  options?: string[]; // Cho select/radio
  required?: boolean;
  placeholder?: string;
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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', default: null })
  parent_id?: MongooseSchema.Types.ObjectId | null;

  @Prop({ type: Array, default: [] })
  custom_fields_schema?: CustomFieldSchema[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Thêm các index để tối ưu hiệu suất truy vấn
CategorySchema.index({ name: 1 }); // Index cho tra cứu danh mục theo tên
CategorySchema.index({ slug: 1 }, { unique: true }); // Index unique cho slug (URL-friendly identifier)
CategorySchema.index({ parent_id: 1 }); // Index cho tra cứu danh mục con theo danh mục cha
