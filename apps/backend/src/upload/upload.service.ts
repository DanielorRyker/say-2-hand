import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';
<<<<<<< HEAD
=======
import { UsersService } from 'src/users/users.service';
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb

@Injectable()
export class UploadService {
  private storage: Storage;
  private bucketName = 'say2hand'; // tên bucket

<<<<<<< HEAD
  constructor() {
=======
  constructor(
    private usersService: UsersService,
  ) {
    
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
    this.storage = new Storage({
      keyFilename: path.join(
        process.cwd(),
        process.env.GOOGLE_APPLICATION_CREDENTIALS as string
      ),
      projectId: 'say2hand', // ID project trên GCP (không phải bucket name)
    });
  }

<<<<<<< HEAD
  async uploadFile(file: Express.Multer.File) {
=======
  async uploadFile(userId: string ,file: Express.Multer.File) {
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
    const bucket = this.storage.bucket(this.bucketName);

    // thêm "avatar/" vào trước tên file để phân folder
   const random = Math.floor(100000 + Math.random() * 900000).toString();
    const fileName = `avatars/${Date.now()}-${random}`;
<<<<<<< HEAD
=======
    await this.usersService.update({
            _id: userId,
            avatar: fileName,
          });
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
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
