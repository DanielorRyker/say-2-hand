import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender_id: Types.ObjectId;

  @Prop({ type: String, enum: ['text', 'image', 'file'], default: 'text' })
  type: string;

  @Prop({ type: String })
  text: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  read_by: Types.ObjectId[];

  @Prop({ type: Date, default: Date.now })
  created_at: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
