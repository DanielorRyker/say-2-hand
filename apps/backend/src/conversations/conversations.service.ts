import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Conversation, ConversationDocument} from './schemas/conversation.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
  ){}

  // create(createConversationDto: CreateConversationDto) {
  //   return 'This action adds a new conversation';
  // }

   async create(createConversationDto: CreateConversationDto) {
  const { post_id, participants } = createConversationDto;

  // Đảm bảo participants có đúng 2 user
  if (participants.length !== 2) {
    throw new BadRequestException('Participants must be exactly 2 users');
  }

  const [a, b] = participants;
  const conversationKey = `post:${post_id}|a:${a}|b:${b}`;

  // Kiểm tra nếu đã tồn tại
  let conversation = await this.conversationModel.findOne({ conversation_key: conversationKey });

  if (!conversation) {
    conversation = new this.conversationModel({
      post_id,
      participants,
      conversation_key: conversationKey,
    });
    await conversation.save();
  }

  return conversation;
}

async updateLastMessage(id: string, updateConversationDto: UpdateConversationDto) {
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


 
  // async findConversationsByUserId(userId :string) {
  //   return this.conversationModel.find({ participants: userId });
  // }

  //   async findConversationsByUserId(userId :string) {
  //   return this.conversationModel.find({
  //   participants: { $in: [new Types.ObjectId(userId)] },
  // }).sort({ updatedAt: -1 });
  // }

  async findConversationsByUserId(userId: string) {
  return this.conversationModel
    .find({
      participants: { $in: [new Types.ObjectId(userId)] },
    })
    .populate('post_id') // lấy thêm thông tin post
    .populate('last_message.sender_id', 'full_name avatar') // chỉ lấy 1 số field user
    .sort({ updatedAt: -1 })
    .exec();
}


  findAll() {
    return `This action returns all conversations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} conversation`;
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return `This action updates a #${id} conversation`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }

  findByKey(conversation_key:string){
    return this.conversationModel.findOne({conversation_key});
  }
}
