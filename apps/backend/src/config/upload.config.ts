import { ConfigService } from '@nestjs/config';
import { MulterModuleOptions } from '@nestjs/platform-express';
import * as multer from 'multer';

export const getUploadConfig = (
  configService: ConfigService,
): MulterModuleOptions => {
  // Allow overriding max upload size via env UPLOAD_MAX_FILE_SIZE_MB (defaults to 10MB)
  const fileSizeMb = parseInt(
    configService.get<string>('UPLOAD_MAX_FILE_SIZE_MB') ?? '10',
    10,
  );
  return {
    storage: multer.memoryStorage(),
    limits: {
      fileSize: fileSizeMb * 1024 * 1024, // configurable max size
    },
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/)) {
        return callback(
          new Error('Only image and document files are allowed!'),
          false,
        );
      }
      callback(null, true);
    },
  };
};

export const getGoogleCloudStorageConfig = (configService: ConfigService) => {
  return {
    projectId: configService.get<string>('GOOGLE_CLOUD_PROJECT_ID'),
    keyFilename: configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS'),
    bucketName:
      configService.get<string>('GOOGLE_CLOUD_BUCKET_NAME') ||
      'say2hand-uploads',
  };
};
