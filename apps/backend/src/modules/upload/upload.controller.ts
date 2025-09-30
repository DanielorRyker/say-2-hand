import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // @Post('avatar')
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  //   const url = await this.uploadService.uploadFile(file);
  //   return { url }; // trả về link ảnh public
  // }
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    const url = await this.uploadService.uploadFile(userId, file);
    return { url };
  }

  @Post('postIMG')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPostImage(@UploadedFile() file: Express.Multer.File) {
    const filename = await this.uploadService.uploadFilePost(file);
    return { filename };
  }

  @Post('img')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('bucket') bucket: string,
  ) {
    const filename = await this.uploadService.uploadImg(file, bucket);
    return { filename };
  }
}
