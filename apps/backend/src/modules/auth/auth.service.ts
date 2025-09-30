import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
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
    return {
      access_token: await this.jwtService.signAsync(payload, {
        expiresIn: '2m',
      }),
    };
  }

  //tạo OTP
  async createHashOTP(otp: string, email: string): Promise<any> {
    const userId = await this.usersService.findIdByEmail(email);
    if (!userId) {
      console.error('Không tìm thấy user với email:', email);
      return null;
    }
    const hashOTP = await hashPasswordHelper(otp);
    if (!hashOTP) {
      throw new Error('Hashing OTP failed');
    }
    await this.verificationTokensService.create({
      user_id: userId, // test tạm bằng 1 ObjectId hợp lệ
      type: 'email',
      token_hash: hashOTP,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // hết hạn sau 5 phút
      consumed: false,
    });
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
  //tạo OTP
  async createHashOTPPassword(otp: string, email: string): Promise<any> {
    const userId = await this.usersService.findIdByEmail(email);
    if (!userId) {
      console.error('Không tìm thấy user với email:', email);
      return null;
    }
    const hashOTP = await hashPasswordHelper(otp);
    if (!hashOTP) {
      throw new Error('Hashing OTP failed');
    }
    await this.passwordResetsService.create({
      user_id: userId, // test tạm bằng 1 ObjectId hợp lệ
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
