import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from 'src/conversations/schemas/conversation.schema';
import { ConversationsService } from 'src/conversations/conversations.service';

@Injectable()
export class MessagesService {

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
     private conversationsService: ConversationsService,
  ) {}

  // create(createMessageDto: CreateMessageDto) {
  //   return 'This action adds a new message';
  // }
 
//   async create(createMessageDto: CreateMessageDto): Promise<Message> {
//   // Bước 1: Tạo message mới
//   const message = new this.messageModel({
//     ...createMessageDto,
//     conversation_id: new Types.ObjectId(createMessageDto.conversation_id), // ép sang ObjectId
//     sender_id: new Types.ObjectId(createMessageDto.sender_id),             // ép sang ObjectId
//     read_by: [new Types.ObjectId(createMessageDto.sender_id)], // Người gửi mặc định "đã đọc"
//   });

//   const savedMessage = await message.save();

//   // Bước 2: Cập nhật last_message trong Conversation
//   await this.conversationModel.findByIdAndUpdate(
//     createMessageDto.conversation_id,
//     {
//       last_message: {
//         text: createMessageDto.text,
//         sender_id: new Types.ObjectId(createMessageDto.sender_id),
//         created_at: savedMessage.created_at,
//       },
//     },
//     { new: true },
//   );

//   return savedMessage;
// }

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
    .populate("sender_id", "full_name avatar")
    .exec();
}


  async findByConversation(conversationId: string) {
      return this.messageModel
        .find({ conversation_id: new Types.ObjectId(conversationId) })
        .populate("sender_id", "full_name avatar") // lấy thêm tên & avatar người gửi
        .sort({ created_at: 1 }) // sort tăng dần theo thời gian
        .exec();
    }

  findAll() {
    return `This action returns all messages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }
}
