import { Body, Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyResetPasswordDto } from './dto/verify-reset-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtAuthGuard } from 'src/common/jwt/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly mailerService: MailerService,
  ) {}

  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user with email and password',
  })
  @ApiBody({ type: CreateAuthDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful - Returns JWT token',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  signIn(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signIn(
      createAuthDto.email,
      createAuthDto.password_hash,
    );
  }

  @Get('mail/')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 emails per minute
  @ApiOperation({
    summary: 'Send OTP email',
    description: 'Send verification OTP to user email',
  })
  @ApiQuery({ name: 'email', type: String, description: 'User email address' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 429, description: 'Too many OTP requests' })
  async testMail(@Query('email') email: string) {
    // Generate 8-digit OTP
    const otp = await this.authService.createHashOTP('', email);

    this.mailerService
      .sendMail({
        to: email, // list of receivers
        from: 'noreply@nestjs.com', // sender address
        subject: 'Say2hand - Mã xác nhận OTP', // Subject line
        text: 'Đây là mã xác nhận của bạn: ' + otp, // plaintext body
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Xác nhận tài khoản Say2hand</h2>
            <p>Mã OTP của bạn là:</p>
            <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
            <p>Mã này có hiệu lực trong 10 phút.</p>
            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
          </div>
        `,
      })
      .then(() => {})
      .catch(() => {});

    return { message: 'OTP sent successfully' };
  }

  @Post('verify')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifiAccount(verifyOtpDto.otp, verifyOtpDto.email);
  }

  //Gửi mail để đổi mật khẩu
  // Removed @UseGuards(JwtAuthGuard) - user is not authenticated in forgot password flow
  @Get('mailResetPassword/')
  async sendMailResetPassword(@Query('email') email: string) {
    // Generate 8-digit OTP (consistent with registration OTP)
    const otp = Math.floor(10000000 + Math.random() * 90000000).toString();

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

    return { message: 'OTP đã được gửi tới email', success: true };
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
