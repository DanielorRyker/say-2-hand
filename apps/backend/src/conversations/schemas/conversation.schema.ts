import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true }) 
export class Conversation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[]; 

 @Prop({
  type: {
    _id: false, // Tắt tự động tạo _id
    text: { type: String },
    sender_id: { type: Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now },
  },
  default: null,
})
last_message: {
  text: string;
  sender_id: Types.ObjectId;
  created_at: Date;
};


  @Prop({ type: String, required: true, unique: true })
  conversation_key: string; 
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
