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
    const {  full_name, email, password_hash } = createUserDto;
    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`email da ton tai: ${email}`);
    }
    const hashPassword = await hashPasswordHelper(password_hash);
    const user = await this.userModel.create({
      
      full_name,
      email,
      password_hash: hashPassword,
      is_active: true,
      role: 'user',
      //status:'inactive',
      // email_verified : false,
      // phone_verified:false
    
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

  async update(updateUserDto: UpdateUserDto, userId?: string, email_verified?: any, p0?: boolean, status?: string, p1?: string, avatar?: string) {
    return this.userModel.updateOne(
      { _id: updateUserDto._id },
      { ...updateUserDto },
    );
  }

  async remove(_id: string) {
    return this.userModel.deleteOne({ _id });
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  // async findByUserId(userId: string) {
  //   return this.userModel.findOne({ user_id: userId }).exec();
  // }

async findIdByEmail(email: string): Promise<string | null> {
  const user = await this.userModel.findOne({ email }).exec();
  return user ? (user._id as Types.ObjectId).toString() : null;
}


async inactiveAcount(email: string): Promise<boolean> {
  const user = await this.userModel.findOne({ email }).exec();
  if (!user) {
    return false; // không tìm thấy user
  }
  
  return user.status === 'active';
}
}
