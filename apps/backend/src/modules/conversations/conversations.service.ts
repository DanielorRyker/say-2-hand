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
import { ChatGateway } from '../../common/socket/chat.gateway';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly chatGateway: ChatGateway,
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

    // Lấy thông tin sản phẩm từ post_id
    const postModel = this.conversationModel.db.model('Post');
    const postRaw = await postModel.findById(post_id).lean();
    const post = Array.isArray(postRaw) ? postRaw[0] : postRaw;
    let sellerId: string | undefined = undefined;
    let buyerId: string | undefined = undefined;
    if (post) {
      sellerId = post.author_id?.toString();
      buyerId = sortedParticipants.find((id) => id !== sellerId) || undefined;
    }

    if (!conversation) {
      conversation = new this.conversationModel({
        post_id,
        participants: sortedParticipants, // lưu luôn theo thứ tự
        conversation_key: conversationKey,
      });
      await conversation.save();
    }

    // Luôn kiểm tra và gửi message hệ thống về sản phẩm mới nếu cần
    if (post && sellerId && buyerId) {
      // Lấy message cuối cùng của hội thoại
      const messageModel = this.conversationModel.db.model('Message');
      const lastMsg = await messageModel
        .findOne({ conversation_id: conversation._id })
        .sort({ created_at: -1 })
        .lean();

      let shouldSendSystemMsg = true;
      if (
        lastMsg &&
        !Array.isArray(lastMsg) &&
        (lastMsg as any).type === 'system' &&
        (lastMsg as any).text
      ) {
        try {
          const lastContent = JSON.parse((lastMsg as any).text);
          if (
            lastContent.product &&
            lastContent.product._id?.toString() === post._id?.toString()
          ) {
            // Nếu message cuối là system về đúng sản phẩm này thì không gửi nữa
            shouldSendSystemMsg = false;
          }
        } catch {}
      }

      if (shouldSendSystemMsg) {
        const systemContent = {
          product: {
            _id: post._id,
            title: post.title,
            image:
              Array.isArray(post.images) && post.images.length > 0
                ? post.images[0].url
                : '',
            price: post.price,
            transaction_type: post.transaction_type,
            condition: post.condition,
          },
          seller_id: sellerId,
          buyer_id: buyerId,
        };
        const systemMsg = await messageModel.create({
          conversation_id: conversation._id,
          sender_id: sellerId,
          type: 'system',
          text: JSON.stringify(systemContent),
          attachments: [],
          read_by: [sellerId, buyerId],
        });
        // Emit realtime cho các client trong phòng hội thoại
        this.chatGateway.server
          .to(`conversation_${conversation._id}`)
          .emit('receive_message', {
            _id: systemMsg._id,
            conversation_id: conversation._id,
            sender_id: sellerId,
            type: 'system',
            text: JSON.stringify(systemContent),
            attachments: [],
            created_at: systemMsg.created_at,
          });
      }
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
      }),
    );

    return withUnread;
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
