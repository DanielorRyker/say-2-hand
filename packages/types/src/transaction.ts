// Transaction Types
export interface Transaction {
  _id: string;
  post_id:
    
     {
        _id: string;
        title: string;
        description?: string;
        images: Array<{
          _id: string;
          url: string;
          alt?: string;
          tags?: string[];
        }>;
        price: number;
        transaction_type: string;
        condition?: string;
        location?: {
          address?: string;
          province?: string;
          district?: string;
        };
        status: string;
        author_id?: string;
      };
  seller_id:
    | string
    | {
        _id: string;
        full_name: string;
        email: string;
        phone?: string;
        avatar?: string;
      };
  buyer_id:
    
    | {
        _id: string;
        full_name: string;
        email: string;
        phone?: string;
        avatar?: string;
      };
  amount: number;
  currency: string;
  payment_gateway: string;
  payment_method: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  transaction_ref: string;
  status: "pending" | "shipping" | "completed" | "cancelled";
  cancel_reason?: string;
  shipping_address?: {
    receiver_name?: string;
    receiver_phone?: string;
    address?: string;
    district?: string;
    province?: string;
    province_code?: number;
  };
  paid_at?: Date;
  shipped_at?: Date;
  completed_at?: Date;
  cancelled_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionDto {
  post_id: string;
  seller_id: string;
  buyer_id: string;
  amount: number;
  currency?: string;
  payment_gateway: string;
  payment_method: string;
  payment_status?: string;
}

export interface UpdateTransactionDto {
  status?: "pending" | "shipping" | "completed" | "cancelled";
  payment_status?: "pending" | "paid" | "failed" | "refunded";
  cancel_reason?: string;
}

export interface TransactionQuery {
  status?: string;
  payment_status?: string;
  page?: number;
  limit?: number;
}
