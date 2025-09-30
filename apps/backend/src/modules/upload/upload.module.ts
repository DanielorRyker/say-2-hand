import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  imports: [UsersModule],
})
export class UploadModule {}
