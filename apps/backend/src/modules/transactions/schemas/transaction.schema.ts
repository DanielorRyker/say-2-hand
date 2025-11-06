import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;
@Schema({ collection: 'transactions', timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyer_id: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: 'VND' })
  currency: string;

  @Prop({ type: String, required: true })
  payment_gateway: string; // ví dụ: 'momo', 'vnpay', 'paypal'

  @Prop({ type: String, required: true })
  payment_method: string; // ví dụ: 'momo', 'credit_card', 'bank_transfer'

  @Prop({
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  })
  payment_status: string;

  @Prop({ type: String, required: true })
  transaction_ref: string; // Mã giao dịch, ví dụ: MOMO202508120001

  @Prop({
    type: String,
    enum: ['pending', 'shipping', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: String })
  cancel_reason?: string;

  // Địa chỉ giao hàng
  @Prop({
    type: {
      receiver_name: String,
      receiver_phone: String,
      address: String,
      district: String,
      province: String,
      province_code: Number,
    },
  })
  shipping_address?: {
    receiver_name?: string;
    receiver_phone?: string;
    address?: string;
    district?: string;
    province?: string;
    province_code?: number;
  };

  // Timeline timestamps
  @Prop({ type: Date })
  paid_at?: Date;

  @Prop({ type: Date })
  shipped_at?: Date;

  @Prop({ type: Date })
  completed_at?: Date;

  @Prop({ type: Date })
  cancelled_at?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Thêm các index để tối ưu hiệu suất truy vấn
TransactionSchema.index({ buyer_id: 1 }); // Index cho tra cứu giao dịch theo người mua
TransactionSchema.index({ seller_id: 1 }); // Index cho tra cứu giao dịch theo người bán
TransactionSchema.index({ post_id: 1 }); // Index cho tra cứu giao dịch theo bài đăng
TransactionSchema.index({ status: 1 }); // Index cho lọc theo trạng thái
TransactionSchema.index({ payment_status: 1 }); // Index cho lọc theo trạng thái thanh toán
TransactionSchema.index({ createdAt: -1 }); // Index cho sắp xếp theo thời gian tạo
// Index kết hợp cho truy vấn phổ biến: tìm giao dịch của người dùng theo trạng thái
TransactionSchema.index({ buyer_id: 1, status: 1 });
TransactionSchema.index({ seller_id: 1, status: 1 });
// Task 22: Unique constraint cho mã giao dịch
TransactionSchema.index({ transaction_ref: 1 }, { unique: true });
