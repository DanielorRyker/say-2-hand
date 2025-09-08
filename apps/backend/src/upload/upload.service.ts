import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class UploadService {
  private storage: Storage;
  private bucketName = 'say2hand'; // tên bucket

  constructor(private usersService: UsersService) {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    const storageConfig: { projectId: string; keyFilename?: string } = {
      projectId: 'say2hand', // ID project trên GCP (không phải bucket name)
    };

    // Only add keyFilename if credentials path is provided
    if (credentialsPath) {
      storageConfig.keyFilename = path.join(process.cwd(), credentialsPath);
    }
    // Nếu không cung cấp file credentials, Storage sẽ sử dụng xác thực mặc định
    // (như Application Default Credentials hoặc service account gắn với môi trường)

    this.storage = new Storage(storageConfig);
  }

  async uploadFile(userId: string, file: Express.Multer.File) {
    const bucket = this.storage.bucket(this.bucketName);

    // thêm "avatar/" vào trước tên file để phân folder
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    const fileName = `avatars/${Date.now()}-${random}`;
    await this.usersService.update({
      _id: userId,
      avatar: fileName,
    });
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
        resolve(publicUrl);
      });

      blobStream.on('error', (err) => {
        reject(
          new Error(`Unable to upload image, something went wrong: ${err}`),
        );
      });

      blobStream.end(file.buffer);
    });
  }

  async uploadFilePost(file: Express.Multer.File) {
    const bucket = this.storage.bucket(this.bucketName);

    // thêm "products/" vào trước tên file để phân folder
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    const fileName = `products/${Date.now()}-${random}`;
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('finish', () => {
        resolve(fileName);
      });

      blobStream.on('error', (err) => {
        reject(
          new Error(`Unable to upload image, something went wrong: ${err}`),
        );
      });

      blobStream.end(file.buffer);
    });
  }

  async uploadImg(file: Express.Multer.File, name: string) {
    const bucket = this.storage.bucket(this.bucketName);

    // thêm "products/" vào trước tên file để phân folder
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    const fileName = `${name}/${Date.now()}-${random}`;
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('finish', () => {
        resolve(fileName);
      });

      blobStream.on('error', (err) => {
        reject(
          new Error(`Unable to upload image, something went wrong: ${err}`),
        );
      });

      blobStream.end(file.buffer);
    });
  }
}
