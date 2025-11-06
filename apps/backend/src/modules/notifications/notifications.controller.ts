import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard) // Bảo vệ toàn bộ controller
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  // Task 23: Thêm pagination
  @Get('user/:userId')
  findByUserId(
    @Param('userId') id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.notificationsService.findByUserId(
      id,
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Get('transaction/:userId')
  findTransaction(@Param('userId') id: string) {
    return this.notificationsService.findTransaction(id);
  }

  @Get('moderation/:userId')
  findModeration(@Param('userId') id: string) {
    return this.notificationsService.findModeration(id);
  }

  @Get('system/:userId')
  findSystem(@Param('userId') id: string) {
    return this.notificationsService.findSystem(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(+id);
  }

  @Patch('read-all/:id')
  updateRead(@Param('id') id: string) {
    return this.notificationsService.readAll(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':receiver_id/:related_id')
  remove(
    @Param('receiver_id') receiver_id: string,
    @Param('related_id') related_id: string,
  ) {
    return this.notificationsService.remove(receiver_id, related_id);
  }
}
