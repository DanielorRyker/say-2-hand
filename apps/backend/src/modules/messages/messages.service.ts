import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from '../conversations/schemas/conversation.schema';
import { ConversationsService } from '../conversations/conversations.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    private conversationsService: ConversationsService,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message | null> {
    // Bước 1: Tạo message mới
    const message = new this.messageModel({
      ...createMessageDto,
      conversation_id: new Types.ObjectId(createMessageDto.conversation_id),
      sender_id: new Types.ObjectId(createMessageDto.sender_id),
      read_by: [new Types.ObjectId(createMessageDto.sender_id)],
    });

    const savedMessage = await message.save();

    // Bước 2: Cập nhật last_message trong Conversation
    await this.conversationModel.findByIdAndUpdate(
      createMessageDto.conversation_id,
      {
        last_message: {
          text: createMessageDto.text,
          sender_id: new Types.ObjectId(createMessageDto.sender_id),
          created_at: savedMessage.created_at,
        },
      },
      { new: true },
    );

    // Bước 3: Populate sender trước khi trả về
    return this.messageModel
      .findById(savedMessage._id)
      .populate('sender_id', 'full_name avatar')
      .exec();
  }

  // Lấy danh sách tin nhắn, không tự động tạo/cập nhật system message
  async findByConversation(conversationId: string) {
    const convObjId = new Types.ObjectId(conversationId);
    return this.messageModel
      .find({ conversation_id: convObjId })
      .populate('sender_id', 'full_name avatar')
      .sort({ created_at: 1 })
      .lean()
      .exec();
  }

  findAll() {
    return `This action returns all messages`;
  }

  async findOne(id: string): Promise<Message | null> {
    return this.messageModel
      .findById(id)
      .populate('sender_id', 'full_name avatar')
      .exec();
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
  ): Promise<Message | null> {
    return this.messageModel
      .findByIdAndUpdate(id, { $set: updateMessageDto }, { new: true })
      .populate('sender_id', 'full_name avatar')
      .exec();
  }

  async remove(id: string): Promise<Message | null> {
    return this.messageModel.findByIdAndDelete(id).exec();
  }

  async removeByConversationIds(conversationIds: Types.ObjectId[]) {
    return this.messageModel
      .deleteMany({ conversation_id: { $in: conversationIds } })
      .exec();
  }

  // Đánh dấu đã đọc tất cả tin nhắn trong conversation
  async markAsRead(conversationId: string, userId: string) {
    const convObjId = new Types.ObjectId(conversationId);
    const userObjId = new Types.ObjectId(userId);

    const result = await this.messageModel.updateMany(
      {
        conversation_id: convObjId,
        read_by: { $ne: userObjId },
      },
      {
        $push: { read_by: userObjId },
      },
    );

    return {
      message: ` Đã đánh dấu ${result.modifiedCount} tin nhắn là đã đọc.`,
      modifiedCount: result.modifiedCount,
    };
  }
}
