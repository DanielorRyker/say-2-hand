import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter_id: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['post', 'user', 'message', 'comment'],
    required: true,
  })
  target_type: string;

  @Prop({ type: Types.ObjectId, required: true })
  target_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  reason_code: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  evidence_urls: string[];

  @Prop({
    type: String,
    enum: ['new', 'in_review', 'resolved', 'invalid'],
    default: 'new',
  })
  status: string;

  @Prop({ type: String, enum: ['low', 'medium', 'high'], default: 'low' })
  severity: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolved_by: Types.ObjectId;

  @Prop({ type: Date })
  resolved_at: Date;

  @Prop({ type: String })
  action_taken: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Indexes
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ target_type: 1, target_id: 1 });
ReportSchema.index({ reporter_id: 1 });
