import { Body, Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtAuthGuard } from 'src/common/jwt/jwt-auth.guard';

export class VerifyOtpDto {
  email: string;
  otp: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly mailerService: MailerService,
  ) {}

  @Post('login')
  signIn(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signIn(
      createAuthDto.email,
      createAuthDto.password_hash,
    );
  }

  @Get('mail/')
  async testMail(@Query('email') email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.authService.createHashOTP(otp, email);

    this.mailerService
      .sendMail({
        to: email, // list of receivers
        from: 'noreply@nestjs.com', // sender address
        subject: 'Say2hand', // Subject line
        text: 'Đây là mã xác nhận của bạn: ' + otp, // plaintext body
        html: '<b>Đây là mã xác nhận của bạn:' + otp + '</b>', // HTML body content
      })
      .then(() => {})
      .catch(() => {});

    return 'ok';
  }

  @Post('verify')
  async verifyOtp(@Body() body: any) {
    const email = body.email;
    const otp = body.otp;

    return this.authService.verifiAccount(otp, email);
  }

  //Gửi mail để đổi mật khẩu
  @UseGuards(JwtAuthGuard)
  @Get('mailResetPassword/')
  async sendMailResetPassword(@Query('email') email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    //tạo OTP trên database
    await this.authService.createHashOTPPassword(otp, email);

    this.mailerService
      .sendMail({
        to: email, // list of receivers
        from: 'noreply@nestjs.com', // sender address
        subject: 'Say2hand', // Subject line
        text: 'Đây là mã đặt lại mật khẩu của bạn: ' + otp, // plaintext body
        html: '<b>Đây là mã đặt lại mật khẩu của bạn:' + otp + '</b>', // HTML body content
      })
      .then(() => {})
      .catch(() => {});

    return 'ok';
  }

  @Post('verifyResetPassword')
  async verifyOtpResetPassword(@Body() body: any) {
    const email = body.email;
    const otp = body.otp;
    const password = body.password;

    return this.authService.verifiResetPassword(otp, email, password);
  }
}
