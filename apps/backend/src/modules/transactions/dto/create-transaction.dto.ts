import { IsString, IsNotEmpty, IsMongoId, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateTransactionDto {
  @IsMongoId()
  @IsNotEmpty()
  post_id: string;

  @IsMongoId()
  @IsNotEmpty()
  seller_id: string;

  @IsMongoId()
  @IsNotEmpty()
  buyer_id: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string; // mặc định 'VND'

  @IsString()
  @IsNotEmpty()
  payment_gateway: string; // 'momo', 'vnpay', ...

  @IsString()
  @IsNotEmpty()
  payment_method: string; // 'momo', 'bank_transfer', ...

  @IsEnum(['pending', 'paid', 'failed', 'refunded'])
  @IsOptional()
  payment_status?: string; // mặc định 'pending'

  @IsString()
  @IsNotEmpty()
  transaction_ref: string; // ví dụ MOMO202508120001

  @IsEnum(['pending', 'completed', 'cancelled'])
  @IsOptional()
  status?: string; // mặc định 'pending'
}
