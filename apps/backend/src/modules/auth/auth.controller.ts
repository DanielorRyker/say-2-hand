import { Body, Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyResetPasswordDto } from './dto/verify-reset-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtAuthGuard } from 'src/common/jwt/jwt-auth.guard';

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
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifiAccount(verifyOtpDto.otp, verifyOtpDto.email);
  }

  //Gửi mail để đổi mật khẩu
  // Removed @UseGuards(JwtAuthGuard) - user is not authenticated in forgot password flow
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
  async verifyOtpResetPassword(@Body() dto: VerifyResetPasswordDto) {
    return this.authService.verifiResetPassword(
      dto.otp,
      dto.email,
      dto.password,
    );
  }
}
