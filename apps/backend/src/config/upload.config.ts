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

  // Allowed MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  return {
    storage: multer.memoryStorage(),
    limits: {
      fileSize: fileSizeMb * 1024 * 1024, // configurable max size
      files: 10, // Max 10 files per request
    },
    fileFilter: (req, file, callback) => {
      // Check MIME type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new Error(
            `File type ${file.mimetype} is not allowed. Only images and documents are accepted.`,
          ),
          false,
        );
      }

      // Check file extension
      if (
        !file.originalname.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i)
      ) {
        return callback(
          new Error(
            'Invalid file extension. Only jpg, jpeg, png, gif, webp, pdf, doc, docx are allowed.',
          ),
          false,
        );
      }

      // Check for suspicious patterns in filename
      if (
        file.originalname.includes('..') ||
        file.originalname.includes('/') ||
        file.originalname.includes('\\')
      ) {
        return callback(new Error('Invalid filename'), false);
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
