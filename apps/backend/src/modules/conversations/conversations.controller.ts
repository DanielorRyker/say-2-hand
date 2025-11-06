import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard) // Bảo vệ toàn bộ controller
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(createConversationDto);
  }

  @Get()
  findAll() {
    return this.conversationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(id, updateConversationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(+id);
  }

  @Get('conversation_key/:key')
  findByKey(@Param('key') key: string) {
    return this.conversationsService.findByKey(key);
  }

  @Patch('last-message/:id')
  async updateLastMessage(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationsService.updateLastMessage(
      id,
      updateConversationDto,
    );
  }

  @Get('conversations/:userId')
  async findConversationsByUserId(@Param('userId') userId: string) {
    return this.conversationsService.findConversationsByUserId(userId);
  }
}
