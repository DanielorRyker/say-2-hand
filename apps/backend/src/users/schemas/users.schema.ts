import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ type: String })
  full_name?: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String })
  phone_number?: string;

  @Prop({ type: String, required: true })
  password_hash: string;

  @Prop({ type: String, default: 'user' })
  role: string;

  @Prop({ type: String })
  avatar_url?: string;
  @Prop({ type: String, default: 'inactive' })
  status: string;

  @Prop({ type: Boolean, default: false })
  email_verified: boolean;

  @Prop({ type: Boolean, default: false })
  phone_verified: boolean;

  @Prop({ type: String })
  address_text?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
