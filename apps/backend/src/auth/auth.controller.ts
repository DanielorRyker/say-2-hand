
import { Body, Controller, Post, Get, Query } from '@nestjs/common';
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  async verifyOtp(@Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const email = body.email;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const otp = body.otp;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.authService.verifiAccount(otp, email);
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
  }
}
