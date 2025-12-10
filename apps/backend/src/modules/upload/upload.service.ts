import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import { UsersService } from '../users/users.service';

// Duplicate class và decorator đã bị xóa. Chỉ giữ lại 1 class UploadService duy nhất bên dưới.

@Injectable()
export class UploadService {
  private storage: Storage;
  private bucketName = 'say2hand'; // tên bucket

  constructor(private usersService: UsersService) {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    const storageConfig: { projectId: string; keyFilename?: string } = {
      projectId: 'say2hand', // ID project trên GCP (không phải bucket name)
    };

    if (credentialsPath) {
      // Nếu là đường dẫn tuyệt đối, không nối thêm process.cwd()
      storageConfig.keyFilename = credentialsPath;
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

  async uploadImg(file: Express.Multer.File, folder: string) {
    const bucket = this.storage.bucket(this.bucketName);
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    const fileName = `${folder}/${Date.now()}-${random}`;
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

  //Upload nhiều ảnh
  async uploadImgs(files: Express.Multer.File[], folder: string) {
    const bucket = this.storage.bucket(this.bucketName);

    const uploadPromises = files.map((file) => {
      const nameSlugify = this.slugify(folder);
      const random = Math.floor(100000 + Math.random() * 900000).toString();
      const fileName = `${nameSlugify}/${Date.now()}-${random}-${file.originalname}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      return new Promise<string>((resolve, reject) => {
        blobStream.on('finish', () => resolve(fileName));
        blobStream.on('error', (err) =>
          reject(new Error(`Unable to upload ${file.originalname}: ${err}`)),
        );
        blobStream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);
    return results; // Trả về mảng tên file
  }

  //Xóa ảnh
  async deleteFileOrFolder(filePath: string) {
    const bucket = this.storage.bucket(this.bucketName);

    try {
      //  Tách phần cuối để slugify (chỉ slugify tên bài viết)

      // const normalizedPath = [...parts, slugifiedLast].join('/');
      const normalizedPath = this.slugify(filePath);

      //  Thêm "/" để tìm tất cả file con
      const prefix = normalizedPath.endsWith('/')
        ? normalizedPath
        : `${normalizedPath}/`;

      console.log(' Đang xóa:', prefix);

      const [files] = await bucket.getFiles({ prefix });

      if (files.length > 0) {
        // Xóa thư mục và tất cả file con
        await Promise.all(files.map((file) => file.delete()));
        console.log(
          ` Đã xóa thư mục "${normalizedPath}" cùng ${files.length} file con.`,
        );
        return {
          message: `Đã xóa thư mục ${normalizedPath} và toàn bộ nội dung.`,
        };
      } else {
        // Nếu không có file nào, thử xóa 1 file cụ thể
        await bucket.file(normalizedPath).delete();
        console.log(` Đã xóa file: ${normalizedPath}`);
        return { message: `Đã xóa file ${normalizedPath}` };
      }
    } catch (error: any) {
      console.error(` Lỗi khi xóa ${filePath}:`, error.message);
      throw new Error(`Không thể xóa ${filePath}: ${error.message}`);
    }
  }

  slugify(input: string): string {
    return input
      .normalize('NFD') // tách dấu
      .replace(/đ/g, 'd') // xử lý chữ đ
      .replace(/Đ/g, 'd') // xử lý chữ Đ
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // space -> -
      .replace(/[^a-z0-9\-\\/]/g, '')
      .replace(/-+/g, '-'); // gộp nhiều -
  }

  /**
   * Upload video lên Google Cloud Storage
   * @param file File video upload từ client
   * @param folder Tên folder hoặc bucket con (mặc định: 'videos')
   * @returns Tên file đã upload
   */
  async uploadVideo(file: Express.Multer.File, folder: string = 'videos') {
    // Lấy bucket
    const bucket = this.storage.bucket(this.bucketName);
    // Tạo tên file duy nhất
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    const fileName = `${folder}/${Date.now()}-${random}-${file.originalname}`;
    const blob = bucket.file(fileName);

    // Tạo stream upload
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype || 'video/mp4', // Ưu tiên mimetype client gửi lên
    });

    // Trả về promise khi upload xong
    return new Promise<string>((resolve, reject) => {
      blobStream.on('finish', () => {
        resolve(fileName);
      });
      blobStream.on('error', (err) => {
        reject(new Error(`Không thể upload video: ${err}`));
      });
      blobStream.end(file.buffer);
    });
  }
}
