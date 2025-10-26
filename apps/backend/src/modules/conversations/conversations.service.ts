import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../messages/schemas/message.schema';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>, 
  ) {}

  async create(createConversationDto: CreateConversationDto) {
  const { post_id, participants } = createConversationDto;

  // Đảm bảo participants có đúng 2 user
  if (participants.length !== 2) {
    throw new BadRequestException('Participants must be exactly 2 users');
  }

  // Sắp xếp userId theo alphabet/hex string để đảm bảo thứ tự cố định
  const sortedParticipants = [...participants].sort();
  const conversationKey = `users:${sortedParticipants.join('-')}`;

  // Kiểm tra nếu đã tồn tại
  let conversation = await this.conversationModel.findOne({
    conversation_key: conversationKey,
  });

  if (!conversation) {
    conversation = new this.conversationModel({
      post_id,
      participants: sortedParticipants, // lưu luôn theo thứ tự
      conversation_key: conversationKey,
    });
    await conversation.save();
  }

  return conversation;
}


  async updateLastMessage(
    id: string,
    updateConversationDto: UpdateConversationDto,
  ) {
    const { last_message } = updateConversationDto;

    if (!last_message) {
      throw new NotFoundException('last_message is required');
    }

    const updated = await this.conversationModel.findByIdAndUpdate(
      id,
      {
        last_message: {
          text: last_message.text,
          sender_id: last_message.sender_id,
          created_at: new Date(), // server tự sinh
        },
      },
      { new: true }, // trả về document sau khi update
    );

    if (!updated) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }

    return updated;
  }

  async findConversationsByUserId(userId: string) {
  const userObjectId = new Types.ObjectId(userId);

  // 1️⃣ Lấy tất cả conversation của user
  const conversations = await this.conversationModel
    .find({
      participants: { $in: [userObjectId] },
    })
    .populate('participants', 'full_name avatar')
    .populate('post_id')
    .populate('last_message.sender_id', 'full_name avatar')
    .sort({ updatedAt: -1 })
    .lean(); // dùng lean() để thao tác nhanh hơn

  // 2️⃣ Với mỗi conversation, đếm tin nhắn chưa đọc
  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await this.messageModel.countDocuments({
        conversation_id: conv._id,
        sender_id: { $ne: userObjectId },
        read_by: { $ne: userObjectId },
      });
      return { ...conv, unreadCount };
    })
  );

  return withUnread;
}


  async findByPostId(postId: string){
    return this.conversationModel.find({ post_id: postId }).exec();
  }

  async removeByIds(conversationIds: Types.ObjectId[]) {
    return this.conversationModel
      .deleteMany({ _id: { $in: conversationIds } })
      .exec();
  }


  findAll() {
    return `This action returns all conversations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} conversation`;
  }

  update(id: string, updateConversationDto: UpdateConversationDto) {
    return this.conversationModel.findByIdAndUpdate(
      id,
      { $set: updateConversationDto },
      { new: true } // trả về document mới
    );
  }


  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }

  findByKey(conversation_key: string) {
    return this.conversationModel.findOne({ conversation_key });
  }
}
