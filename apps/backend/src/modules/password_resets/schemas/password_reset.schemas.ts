import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PasswordResetDocument = PasswordReset & Document;

@Schema({
  timestamps: true,
  collection: 'password_resets',
})
export class PasswordReset {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  token_hash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ default: false })
  consumed: boolean;
}
export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
