import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Connect to MongoDB successfully');
  const app = await NestFactory.create(AppModule);
  
  const port = process.env.PORT || '';
  
  // Gọi listen() trước để khởi động server
  await app.listen(port);
  ``
  // Sau đó mới gọi getUrl() để lấy địa chỉ
  const url = await app.getUrl();
  
  logger.log(`Server is running on: http://localhost:${port}`);
}
bootstrap();