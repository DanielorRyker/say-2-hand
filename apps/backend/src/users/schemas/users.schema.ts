import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;


@Schema({ 
  timestamps: true, 
  collection: 'users' 
})

export class User {
  @Prop({ type: String, required: true })
  user_id: string;

  @Prop({ type: String, required: true })
  username: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  password_hash: string;

  @Prop({ type: String })
  full_name?: string;

  @Prop({ type: String })
  avatar_url?: string;

  @Prop({ type: String })
  phone_number?: string;

  @Prop({ type: String })
  address_text?: string;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ type: Number })
  reputation_score?: number;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: String, default: 'user' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
