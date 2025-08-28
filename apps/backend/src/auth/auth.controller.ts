import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';

export class VerifyOtpDto {
  email: string;
  otp: string;
}

export class VerifyResetPasswordDto {
  email: string;
  otp: string;
  password: string;
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

  @Get('mail')
  async sendVerificationMail(@Query('email') email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.authService.createHashOTP(otp, email);
    try {
      await this.mailerService.sendMail({
        to: email,
        from: 'noreply@nestjs.com',
        subject: 'Say2hand',
        text: `Đây là mã xác nhận của bạn: ${otp}`,
        html: `<b>Đây là mã xác nhận của bạn: ${otp}</b>`,
      });
      return { message: 'Verification mail sent' };
    } catch (error) {
      return { message: 'Failed to send mail', error };
    }
  }

  @Post('verify')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifiAccount(dto.otp, dto.email);
  }

  // Gửi mail để đổi mật khẩu
  @Get('mailResetPassword')
  async sendMailResetPassword(@Query('email') email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.authService.createHashOTPPassword(otp, email);
    try {
      await this.mailerService.sendMail({
        to: email,
        from: 'noreply@nestjs.com',
        subject: 'Say2hand',
        text: `Đây là mã đặt lại mật khẩu của bạn: ${otp}`,
        html: `<b>Đây là mã đặt lại mật khẩu của bạn: ${otp}</b>`,
      });
      return { message: 'Reset password mail sent' };
    } catch (error) {
      return { message: 'Failed to send mail', error };
    }
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
