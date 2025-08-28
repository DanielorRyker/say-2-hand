import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
<<<<<<< HEAD

@Module({
=======
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
