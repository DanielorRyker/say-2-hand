import { Body, Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyResetPasswordDto } from './dto/verify-reset-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly mailerService: MailerService,
  ) {}

  // Đăng nhập: Giới hạn 5 lần/60s mỗi IP
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  signIn(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signIn(
      createAuthDto.email,
      createAuthDto.password_hash,
    );
  }

  // Gửi OTP đăng ký: Giới hạn 5 lần/60s mỗi IP
  @Get('mail/')
  @Throttle({ default: { limit: 5, ttl: 60 } })
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

  // Xác thực OTP: Giới hạn 5 lần/60s mỗi IP
  @Post('verify')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifiAccount(verifyOtpDto.otp, verifyOtpDto.email);
  }

  //Gửi mail để đổi mật khẩu
  // Removed @UseGuards(JwtAuthGuard) - user is not authenticated in forgot password flow
  // Gửi OTP quên mật khẩu: Giới hạn 5 lần/60s mỗi IP
  @Get('mailResetPassword/')
  @Throttle({ default: { limit: 5, ttl: 60 } })
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

  // Xác thực OTP quên mật khẩu: Giới hạn 5 lần/60s mỗi IP
  @Post('verifyResetPassword')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async verifyOtpResetPassword(@Body() dto: VerifyResetPasswordDto) {
    return this.authService.verifiResetPassword(
      dto.otp,
      dto.email,
      dto.password,
    );
  }
}
