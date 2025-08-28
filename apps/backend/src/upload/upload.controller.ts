<<<<<<< HEAD
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
=======
import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

<<<<<<< HEAD
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.uploadFile(file);
    return { url }; // trả về link ảnh public
=======
  // @Post('avatar')
  // @UseInterceptors(userId: string, FileInterceptor('file'))
  // async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  //   const url = await this.uploadService.uploadFile(file);
  //   return { url }; // trả về link ảnh public
  // }
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string
  ) {
  const url = await this.uploadService.uploadFile(userId, file);
  return { url };
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
  }
}
