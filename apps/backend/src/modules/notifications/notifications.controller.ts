import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('notifications')
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
  @Get('user/:userId')
  findByUserId(@Param('userId') id: string) {
    return this.notificationsService.findByUserId(id);
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
  updateRead(@Param('id') id: string ) {
    return this.notificationsService.readAll(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
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
