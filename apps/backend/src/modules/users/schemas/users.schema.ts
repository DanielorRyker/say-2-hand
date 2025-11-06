import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

// Interface cho địa chỉ
export class Address {
  @Prop({ type: String })
  label?: string; // Nhà riêng, Văn phòng, etc.

  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: Boolean, default: false })
  is_default: boolean;
}

// Interface cho tài khoản ngân hàng
export class BankAccount {
  @Prop({ type: String, required: true })
  bank_name: string; // Tên ngân hàng

  @Prop({ type: String, required: true })
  account_number: string; // Số tài khoản

  @Prop({ type: String, required: true })
  account_holder: string; // Tên chủ tài khoản

  @Prop({ type: Boolean, default: false })
  is_default: boolean;
}

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
  avatar?: string;

  @Prop({ type: String, default: 'inactive' })
  status: string;

  @Prop({ type: Boolean, default: false })
  email_verified: boolean;

  @Prop({ type: Boolean, default: false })
  phone_verified: boolean;

  @Prop({ type: [Address], default: [] })
  addresses?: Address[];

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Date })
  date_of_birth?: Date;

  @Prop({ type: [BankAccount], default: [] })
  bank_accounts?: BankAccount[];

  @Prop({
    type: {
      total_score: { type: Number, default: 0 },
      total_ratings: { type: Number, default: 0 },
    },
    _id: false,
    default: { total_score: 0, total_ratings: 0 },
  })
  reputation: {
    total_score: number;
    total_ratings: number;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true }); // Task 22: Unique constraint
UserSchema.index({ phone_number: 1 }, { sparse: true });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });
