import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';

@Injectable()
export class UploadService {
  private storage: Storage;
  private bucketName = 'say2hand'; // tên bucket

  constructor() {
    this.storage = new Storage({
      keyFilename: path.join(
        process.cwd(),
        process.env.GOOGLE_APPLICATION_CREDENTIALS as string
      ),
      projectId: 'say2hand', // ID project trên GCP (không phải bucket name)
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const bucket = this.storage.bucket(this.bucketName);

    // thêm "avatar/" vào trước tên file để phân folder
   const random = Math.floor(100000 + Math.random() * 900000).toString();
    const fileName = `avatars/${Date.now()}-${random}`;
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
        reject(new Error(`Unable to upload image, something went wrong: ${err}`));
      });

      blobStream.end(file.buffer);
    });
  }
}
