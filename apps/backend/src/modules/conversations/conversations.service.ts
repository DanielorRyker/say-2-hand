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

    // ✅ Sử dụng aggregation để tối ưu N+1 query - chỉ 1 query duy nhất thay vì N+1 queries
    const conversations = await this.conversationModel.aggregate([
      // Match conversations của user
      {
        $match: {
          participants: userObjectId,
        },
      },
      // Sort theo thời gian cập nhật
      {
        $sort: { updatedAt: -1 },
      },
      // Lookup để lấy thông tin participants (thay populate)
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          pipeline: [
            {
              $project: { full_name: 1, avatar: 1 }, // Chỉ lấy fields cần thiết
            },
          ],
          as: 'participants',
        },
      },
      // Lookup để lấy thông tin post
      {
        $lookup: {
          from: 'posts',
          localField: 'post_id',
          foreignField: '_id',
          as: 'post_id',
        },
      },
      {
        $unwind: {
          path: '$post_id',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup để lấy thông tin sender của last_message
      {
        $lookup: {
          from: 'users',
          localField: 'last_message.sender_id',
          foreignField: '_id',
          pipeline: [
            {
              $project: { full_name: 1, avatar: 1 },
            },
          ],
          as: 'last_message_sender',
        },
      },
      {
        $unwind: {
          path: '$last_message_sender',
          preserveNullAndEmptyArrays: true,
        },
      },
      // ✅ Đếm tin nhắn chưa đọc ngay trong aggregation (tối ưu N+1)
      {
        $lookup: {
          from: 'messages',
          let: { conversationId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$conversation_id', '$$conversationId'] },
                    { $ne: ['$sender_id', userObjectId] },
                    { $not: { $in: [userObjectId, '$read_by'] } },
                  ],
                },
              },
            },
            {
              $count: 'count',
            },
          ],
          as: 'unread_messages',
        },
      },
      // Project để format kết quả
      {
        $addFields: {
          'last_message.sender_id': '$last_message_sender',
          unreadCount: {
            $ifNull: [{ $arrayElemAt: ['$unread_messages.count', 0] }, 0],
          },
        },
      },
      // Loại bỏ field tạm
      {
        $project: {
          last_message_sender: 0,
          unread_messages: 0,
        },
      },
    ]);

    return conversations;
  }

  async findByPostId(postId: string) {
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
      { new: true }, // trả về document mới
    );
  }

  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }

  findByKey(conversation_key: string) {
    return this.conversationModel.findOne({ conversation_key });
  }
}
