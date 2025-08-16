import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/users.schema';
import { Model, Types } from 'mongoose';
import { hashPasswordHelper } from 'src/common/helpers/util';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  isEmailExist = async (email: string): Promise<boolean> => {
    const user = await this.userModel.exists({ email });
    return !!user;
  };

  async create(createUserDto: CreateUserDto) {
    const { user_id, username, email, password_hash } = createUserDto;
    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`email da ton tai: ${email}`);
    }
    const hashPassword = await hashPasswordHelper(password_hash);
    const user = await this.userModel.create({
      user_id,
      username,
      email,
      password_hash: hashPassword,
      is_active: true,
      role: 'user',
    });
    return { _id: user._id };
  }

  findAll() {
    return 'This action returns all users';
  }

  async findOne(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(updateUserDto: UpdateUserDto) {
    return this.userModel.updateOne(
      { user_id: updateUserDto.user_id },
      { ...updateUserDto },
    );
  }

  async remove(user_id: string) {
    return this.userModel.deleteOne({ user_id });
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async findByUserId(userId: string) {
    return this.userModel.findOne({ user_id: userId }).exec();
  }

  async insertTestUser(): Promise<User> {
    const user = new this.userModel({
      user_id: 'U1003',
      username: 'testuser3',
      email: 'test2@example.com',
      password_hash: 'hashed_password_here',
      full_name: 'Nguyễn Văn A2',
      avatar_url: 'https://example.com/avatar.png',
      phone_number: '+84901234567',
      address_text: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh',
      longitude: 106.700981,
      reputation_score: 85,
      is_active: true,
      role: 'user',
    });
    return user.save();
  }
}
