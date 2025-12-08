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

  // In-memory timers for scheduled auto-complete after ship
  private autoCompleteTimers: Map<string, NodeJS.Timeout> = new Map();

  async create(createTransactionDto: CreateTransactionDto) {
    // Kiểm tra trùng đơn: cùng post_id, buyer_id, status chưa hoàn thành
    const existing = await this.transactionModel.findOne({
      post_id: new Types.ObjectId(createTransactionDto.post_id),
      buyer_id: new Types.ObjectId(createTransactionDto.buyer_id),
      status: { $in: ['pending', 'shipping'] },
    });
    if (existing) {
      throw new BadRequestException(
        'Bạn đã có đơn hàng đang xử lý cho sản phẩm này. Vui lòng không thao tác lặp.',
      );
    }
    try {
       let ref='';
      if(createTransactionDto.payment_method==="free"){
       ref=`FREE${Date.now()}${Math.floor(Math.random() * 1000)}`;
      }
      else{
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ref=`VNPAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
      }

      const newTransaction = new this.transactionModel({
        ...createTransactionDto,
        post_id: new Types.ObjectId(createTransactionDto.post_id),
        seller_id: new Types.ObjectId(createTransactionDto.seller_id),
        buyer_id: new Types.ObjectId(createTransactionDto.buyer_id),
        transaction_ref: ref,
        paid_at: new Date(), // Assume payment is made on creation
      });
      const savedTransaction = await newTransaction.save();
      return {
        message: 'Tạo đơn hàng thành công',
        data: savedTransaction,
      };
    } catch (error) {
      console.error(' Mongo Save Error:', error.message);
      console.error(' Stack:', error.stack);
      throw error;
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
        select:
          'title description images price transaction_type condition location status author_id',
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
        // select: 'title images price transaction_type status',
        populate: {
          path: 'category_id',
        },
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

    // Clear any scheduled auto-complete timer for this order
    if (this.autoCompleteTimers.has(id)) {
      const t = this.autoCompleteTimers.get(id);
      if (t) clearTimeout(t);
      this.autoCompleteTimers.delete(id);
    }

    // Cập nhật trạng thái transaction
    transaction.status = 'cancelled';
    transaction.payment_status = 'refunded';
    transaction.cancelled_at = new Date();
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
    transaction.shipped_at = new Date();
    await transaction.save();

    // Schedule auto-complete after 5 seconds (server-side)
    try {
      // Clear any existing timer
      if (this.autoCompleteTimers.has(id)) {
        const existing = this.autoCompleteTimers.get(id);
        if (existing) clearTimeout(existing);
        this.autoCompleteTimers.delete(id);
      }

      const timer = setTimeout(() => {
        void (async () => {
          try {
            const fresh = await this.transactionModel.findById(id);
            if (!fresh) return;
            // only complete if still in shipping state
            if (fresh.status === 'shipping') {
              await this.completeOrder(id);
            }
          } catch (err) {
            console.error('Auto-complete error for transaction', id, err);
          } finally {
            this.autoCompleteTimers.delete(id);
          }
        })();
      }, 5000);

      this.autoCompleteTimers.set(id, timer);
    } catch (err) {
      console.error('Failed to schedule auto-complete for', id, err);
    }

    return {
      message:
        'Order marked as shipped successfully; auto-complete scheduled in 5s',
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
    transaction.completed_at = new Date();
    await transaction.save();

    // Clear any scheduled auto-complete timer (if present)
    if (this.autoCompleteTimers.has(id)) {
      const t = this.autoCompleteTimers.get(id);
      if (t) clearTimeout(t);
      this.autoCompleteTimers.delete(id);
    }

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

  // Admin: Lấy tất cả giao dịch với filter
  async getAllTransactionsForAdmin(status?: string) {
    const query: Record<string, any> = {};
    if (status) {
      query.status = status;
    }

    const transactions = await this.transactionModel
      .find(query)
      .populate({
        path: 'post_id',
        select: 'title images price transaction_type status',
      })
      .populate({
        path: 'seller_id',
        select: 'full_name email phone avatar',
      })
      .populate({
        path: 'buyer_id',
        select: 'full_name email phone avatar',
      })
      .sort({ createdAt: -1 })
      .exec();

    return {
      message: 'All transactions retrieved successfully',
      data: transactions,
    };
  }

  // Admin: Lấy thống kê giao dịch
  async getTransactionStatistics() {
    const totalTransactions = await this.transactionModel.countDocuments();
    const pendingCount = await this.transactionModel.countDocuments({
      status: 'pending',
    });
    const shippingCount = await this.transactionModel.countDocuments({
      status: 'shipping',
    });
    const completedCount = await this.transactionModel.countDocuments({
      status: 'completed',
    });
    const cancelledCount = await this.transactionModel.countDocuments({
      status: 'cancelled',
    });

    // Tính tổng doanh thu từ các giao dịch hoàn thành
    const totalRevenue = await this.transactionModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return {
      message: 'Transaction statistics retrieved successfully',
      data: {
        total: totalTransactions,
        pending: pendingCount,
        shipping: shippingCount,
        completed: completedCount,
        cancelled: cancelledCount,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    };
  }

  // Admin: Cập nhật trạng thái giao dịch
  async updateTransactionStatus(id: string, status: string, note?: string) {
    const transaction = await this.transactionModel.findById(id);

    if (!transaction) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }

    const validStatuses = ['pending', 'shipping', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    transaction.status = status;

    if (status === 'cancelled') {
      transaction.cancelled_at = new Date();
      if (note) {
        transaction.cancel_reason = note;
      }
      transaction.payment_status = 'refunded';

      // Cập nhật trạng thái post về active
      await this.postModel.findByIdAndUpdate(transaction.post_id, {
        status: 'active',
      });
    } else if (status === 'shipping') {
      transaction.shipped_at = new Date();
    } else if (status === 'completed') {
      transaction.completed_at = new Date();

      // Cập nhật trạng thái post thành completed
      await this.postModel.findByIdAndUpdate(transaction.post_id, {
        status: 'completed',
        completed_at: new Date(),
      });
    }

    await transaction.save();

    return {
      message: 'Transaction status updated successfully',
      data: transaction,
    };
  }
}
