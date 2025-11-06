import {
  Body,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard) // Bảo vệ toàn bộ controller
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

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

  @Post('imgs')
  @UseInterceptors(FilesInterceptor('files')) // <-- 'files' là tên field trong FormData
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('bucket') bucket: string,
  ) {
    const filenames = await this.uploadService.uploadImgs(files, bucket);
    return { filenames };
  }

  @Post('deleteIMG')
  async deleteIMG(@Body('bucket') bucket: string) {
    this.logger.log(`Deleting bucket: ${bucket}`);
    const result = await this.uploadService.deleteFileOrFolder(bucket);
    return result;
  }
}
