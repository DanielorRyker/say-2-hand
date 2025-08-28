
<<<<<<< HEAD
import { Body, Controller, Post, HttpCode, HttpStatus, Get, Param, Query } from '@nestjs/common';
=======
import { Body, Controller, Post, Get, Query } from '@nestjs/common';
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';

export class VerifyOtpDto {
  email: string;
  otp: string;
}

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

  @Get('mail/')
  async testMail(@Query('email') email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.authService.createHashOTP(otp,email)

    this.mailerService
      .sendMail({
        
        to: email, // list of receivers
        from: 'noreply@nestjs.com', // sender address
        subject: 'Say2hand', // Subject line
        text: 'Đây là mã xác nhận của bạn: '+otp, // plaintext body
        html: '<b>Đây là mã xác nhận của bạn:'+otp+'</b>', // HTML body content
      })
      .then(() => {})
      .catch(() => {});

      
  
    return 'ok';
  }

   @Post('verify')
<<<<<<< HEAD
  async verifyOtp(@Body() body: any) {
    const email = body.email;
    const otp = body.otp;

    return this.authService.verifiAccount(otp, email);

=======
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  async verifyOtp(@Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const email = body.email;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const otp = body.otp;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.authService.verifiAccount(otp, email);
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
  }
 
  //Gửi mail để đổi mật khẩu
  @Get('mailResetPassword/')
  async sendMailResetPassword(@Query('email') email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    //tạo OTP trên database
    await this.authService.createHashOTPPassword(otp,email)

    this.mailerService
      .sendMail({
        
        to: email, // list of receivers
        from: 'noreply@nestjs.com', // sender address
        subject: 'Say2hand', // Subject line
        text: 'Đây là mã đặt lại mật khẩu của bạn: '+otp, // plaintext body
        html: '<b>Đây là mã đặt lại mật khẩu của bạn:'+otp+'</b>', // HTML body content
      })
      .then(() => {})
      .catch(() => {});

      
  
    return 'ok';
  }

   @Post('verifyResetPassword')
<<<<<<< HEAD
  async verifyOtpResetPassword(@Body() body: any) {
    const email = body.email;
    const otp = body.otp;
    const password = body.password;

    return this.authService.verifiResetPassword(otp, email,password);

=======
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  async verifyOtpResetPassword(@Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const email = body.email;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const otp = body.otp;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const password = body.password;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.authService.verifiResetPassword(otp, email,password);
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
  }
}
