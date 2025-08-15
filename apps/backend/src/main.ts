import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Connect to MongoDB successfully');
  const app = await NestFactory.create(AppModule);
  
 // const port = process.env.PORT || '';
 const configService = app.get(ConfigService); 
 const port = configService.get('PORT');

 app.useGlobalPipes(new ValidationPipe({whitelist:true}));
 app.setGlobalPrefix('api',{exclude:['']});


 // Bật CORS cho FE, dùng khi FE và BE khác port để tránh bị chặn
  app.enableCors({
    origin: 'http://localhost:3000', // FE Next.js đang chạy
    credentials: true,
  }); 
  // Gọi listen() trước để khởi động server
  await app.listen(port);
  
  // Sau đó mới gọi getUrl() để lấy địa chỉ
  const url = await app.getUrl();
  
  logger.log(`Server is running on: http://localhost:${port}`);
}
bootstrap();