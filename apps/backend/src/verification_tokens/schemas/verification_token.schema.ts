import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty } from 'class-validator';
import { Document, Types } from 'mongoose';

export type TokenDocument = VerificationToken & Document;

@Schema({ 
  timestamps: true, 
  collection: 'verification_tokens' 
})
export class VerificationToken {

    @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
    user_id: Types.ObjectId;

  @Prop({ required: true, enum: ['phone', 'email'] }) // có thể thêm enum nếu chỉ có vài loại
  type: string;

  @Prop({ required: true })
  token_hash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ default: false })
  consumed: boolean;




}
export const TokenSchema = SchemaFactory.createForClass(VerificationToken);
