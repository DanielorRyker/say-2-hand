import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class TransactionsService {
  constructor(
      @InjectModel(Transaction.name)
      private transactionModel: Model<TransactionDocument>,
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

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: string, updateTransactionDto: UpdateTransactionDto) {
    return this.transactionModel.findByIdAndUpdate(id,updateTransactionDto).exec();
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
