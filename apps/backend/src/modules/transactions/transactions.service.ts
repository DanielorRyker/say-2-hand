import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../posts/schemas/post.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    try {
      const newTransaction = new this.transactionModel({
        ...createTransactionDto,
        post_id: new Types.ObjectId(createTransactionDto.post_id),
        seller_id: new Types.ObjectId(createTransactionDto.seller_id),
        buyer_id: new Types.ObjectId(createTransactionDto.buyer_id),
        transaction_ref: `VNPAY${Date.now()}${Math.floor(Math.random() * 1000)}`,
      });

      const savedTransaction = await newTransaction.save();

      return {
        message: 'Transaction created successfully',
        data: savedTransaction,
      };
    } catch (error) {
      console.error(' Mongo Save Error:', error.message);
      console.error(' Stack:', error.stack);
      throw error; // tạm thời ném thẳng lỗi thật ra ngoài
    }
  }

  findAll() {
    return this.transactionModel.find();
  }

  async findOne(id: string) {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto) {
    const updated = await this.transactionModel.findByIdAndUpdate(
      id,
      updateTransactionDto,
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return {
      message: 'Transaction updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const result = await this.transactionModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return {
      message: 'Transaction deleted successfully',
    };
  }

  // Lấy đơn hàng của người bán
  async getSellerOrders(sellerId: string, status?: string) {
    const query: Record<string, any> = {
      seller_id: new Types.ObjectId(sellerId),
    };
    if (status) {
      query.status = status;
    }

    const orders = await this.transactionModel
      .find(query)
      .populate({
        path: 'post_id',
        select: 'title images price transaction_type status',
      })
      .populate({
        path: 'buyer_id',
        select: 'full_name email phone avatar',
      })
      .sort({ createdAt: -1 })
      .exec();

    return {
      message: 'Seller orders retrieved successfully',
      data: orders,
    };
  }

  // Lấy đơn hàng của người mua
  async getBuyerOrders(buyerId: string, status?: string) {
    const query: Record<string, any> = {
      buyer_id: new Types.ObjectId(buyerId),
    };
    if (status) {
      query.status = status;
    }

    const orders = await this.transactionModel
      .find(query)
      .populate({
        path: 'post_id',
        select: 'title images price transaction_type status',
      })
      .populate({
        path: 'seller_id',
        select: 'full_name email phone avatar',
      })
      .sort({ createdAt: -1 })
      .exec();

    return {
      message: 'Buyer orders retrieved successfully',
      data: orders,
    };
  }

  // Lấy chi tiết đơn hàng
  async getOrderDetail(id: string) {
    const order = await this.transactionModel
      .findById(id)
      .populate({
        path: 'post_id',
        select:
          'title description images price transaction_type condition location status author_id',
      })
      .populate({
        path: 'seller_id',
        select: 'full_name email phone avatar',
      })
      .populate({
        path: 'buyer_id',
        select: 'full_name email phone avatar',
      })
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return {
      message: 'Order detail retrieved successfully',
      data: order,
    };
  }

  // Huỷ đơn hàng và hoàn tiền
  async cancelOrder(id: string, cancelReason?: string) {
    const transaction = await this.transactionModel.findById(id);

    if (!transaction) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }

    if (
      transaction.status === 'completed' ||
      transaction.status === 'cancelled'
    ) {
      throw new BadRequestException(
        'Cannot cancel completed or already cancelled order',
      );
    }

    // Cập nhật trạng thái transaction
    transaction.status = 'cancelled';
    transaction.payment_status = 'refunded';
    if (cancelReason) {
      transaction.cancel_reason = cancelReason;
    }
    await transaction.save();

    // Cập nhật trạng thái post về active
    await this.postModel.findByIdAndUpdate(transaction.post_id, {
      status: 'active',
    });

    // TODO: Thực hiện hoàn tiền qua payment gateway

    return {
      message: 'Order cancelled and refund initiated successfully',
      data: transaction,
    };
  }

  // Xác nhận gửi hàng
  async shipOrder(id: string) {
    const transaction = await this.transactionModel.findById(id);

    if (!transaction) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }

    if (transaction.status !== 'pending') {
      throw new BadRequestException('Can only ship pending orders');
    }

    transaction.status = 'shipping';
    await transaction.save();

    return {
      message: 'Order marked as shipped successfully',
      data: transaction,
    };
  }

  // Xác nhận đã nhận hàng
  async completeOrder(id: string) {
    const transaction = await this.transactionModel.findById(id);

    if (!transaction) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }

    if (transaction.status !== 'shipping') {
      throw new BadRequestException(
        'Can only complete orders that are being shipped',
      );
    }

    transaction.status = 'completed';
    await transaction.save();

    // Cập nhật trạng thái post thành completed
    await this.postModel.findByIdAndUpdate(transaction.post_id, {
      status: 'completed',
      completed_at: new Date(),
    });

    return {
      message: 'Order completed successfully',
      data: transaction,
    };
  }
}
