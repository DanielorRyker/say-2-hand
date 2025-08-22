
import { Body, Controller, Post, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';


@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly mailerService: MailerService
  ) {}


  @Post('login')
  signIn(@Body() createAuthDto: CreateAuthDto ) {
    return this.authService.signIn(createAuthDto.email,createAuthDto.password_hash);
  }

  @Get('mail')
  testMail( ) {
    this.mailerService
      .sendMail({
        to: 'studies.mail.2024@gmail.com', // list of receivers
        from: 'noreply@nestjs.com', // sender address
        subject: 'Say2hand', // Subject line
        text: 'Đây là mã xác nhận của bạn: ', // plaintext body
        html: '<b>Đây là mã xác nhận của bạn:</b>', // HTML body content
      })
      .then(() => {})
      .catch(() => {});
  
    return 'ok';
  }
}
