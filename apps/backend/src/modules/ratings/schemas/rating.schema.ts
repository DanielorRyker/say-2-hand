import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ collection: 'ratings' ,timestamps: true})
export class Rating extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  rater_id: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ratee_id: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true })
  transaction_id: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  score: number; 

  @Prop({ type: String, maxlength: 500 })
  comment: string; 
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
