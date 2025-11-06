import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  comparePasswordHelper,
  hashPasswordHelper,
} from '../../common/helpers/util';
import { PasswordResetsService } from '../password_resets/password_resets.service';
import { UsersService } from '../users/users.service';
import { VerificationTokensService } from '../verification_tokens/verification_tokens.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private verificationTokensService: VerificationTokensService,
    private passwordResetsService: PasswordResetsService,
  ) {}

  //Đăng nhập
  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    const isValidPassword = await comparePasswordHelper(
      pass,
      user.password_hash,
    );
    if (!isValidPassword) {
      throw new ForbiddenException('Wrong password');
    }
    const payload = { sub: user._id, username: user.email };

    // Sử dụng JWT_ACCESS_TOKEN_EXPIRE từ .env thay vì hardcode
    const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRE || '1d';

    return {
      access_token: await this.jwtService.signAsync(payload, {
        expiresIn: expiresIn as any, // Bypass TypeScript strict type check
      }),
    };
  }

  //tạo OTP
  async createHashOTP(otp: string, email: string): Promise<any> {
    const userId = await this.usersService.findIdByEmail(email);
    if (!userId) {
      this.logger.error(`User not found with email: ${email}`);
      throw new NotFoundException(`User not found with email: ${email}`);
    }

    // Improved OTP: 8 digits for better security
    const secureOTP = Math.floor(
      10000000 + Math.random() * 90000000,
    ).toString();
    const hashOTP = await hashPasswordHelper(secureOTP);

    await this.verificationTokensService.create({
      user_id: userId,
      type: 'email',
      token_hash: hashOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // hết hạn sau 10 phút (increased from 5)
      consumed: false,
    });

    return secureOTP; // Return OTP để gửi email
  }

  //Kiểm traOTP
  async verifiAccount(otp: string, email: string): Promise<any> {
    const userId = await this.usersService.findIdByEmail(email);
    if (!userId) {
      throw new Error('không tìm thấy user với email: ' + email);
    }

    const tokens = await this.verificationTokensService.findMany(userId);
    let found = false;
    let isOTPexpire = true;

    for (const token of tokens) {
      const isValidOTP = await comparePasswordHelper(otp, token.token_hash);
      isOTPexpire = new Date(token.expiresAt) > new Date();

      if (isValidOTP) {
        found = true;
        if (isOTPexpire == true) {
          // ✅ Cập nhật trạng thái người dùng
          await this.usersService.update({
            _id: userId,
            email_verified: true,
            status: 'active',
          });

          // ✅ Xoá tất cả token đã dùng
          await this.verificationTokensService.remove(userId);
        } else {
          throw new BadRequestException('OTP đã hết hạn: ' + otp);
        }

        break;
      }
    }

    if (!found) {
      throw new NotFoundException('Sai OTP');
    }
  }

  //Tạo OTP cho reset Password
  async createHashOTPPassword(otp: string, email: string): Promise<any> {
    const userId = await this.usersService.findIdByEmail(email);
    if (!userId) {
      this.logger.error(`User not found with email: ${email}`);
      throw new NotFoundException(`User not found with email: ${email}`);
    }
    const hashOTP = await hashPasswordHelper(otp);
    await this.passwordResetsService.create({
      user_id: userId,
      token_hash: hashOTP,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // hết hạn sau 5 phút
      consumed: false,
    });
  }

  //Kiểm tra OTP đổi mật khẩu
  //Kiểm traOTP
  async verifiResetPassword(
    otp: string,
    email: string,
    password: string,
  ): Promise<any> {
    const userId = await this.usersService.findIdByEmail(email);
    if (!userId) {
      throw new Error('không tìm thấy user với email: ' + email);
    }

    const tokens = await this.passwordResetsService.findMany(userId);
    let found = false;
    let isOTPexpire = true;

    for (const token of tokens) {
      const isValidOTP = await comparePasswordHelper(otp, token.token_hash);

      isOTPexpire = new Date(token.expiresAt) > new Date();

      if (isValidOTP) {
        found = true;
        if (isOTPexpire == true) {
          // ✅ Đổi mật khẩu

          const hashPassword = await hashPasswordHelper(password);
          await this.usersService.update({
            _id: userId,
            password_hash: hashPassword,
          });

          // ✅ Xoá tất cả token đã dùng
          await this.passwordResetsService.remove(userId);
        } else {
          throw new BadRequestException('OTP đã hết hạn: ' + otp);
        }

        break;
      }
    }

    if (!found) {
      throw new NotFoundException('Sai OTP:');
    }
  }
}
