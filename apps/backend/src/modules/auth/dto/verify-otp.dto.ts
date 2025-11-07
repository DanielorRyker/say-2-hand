import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'OTP phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'OTP không được để trống' })
  @Length(6, 6, { message: 'OTP phải có đúng 6 ký tự' })
  otp: string;
}
