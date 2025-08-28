import { Injectable } from '@nestjs/common';
import { CreatePasswordResetDto } from './dto/create-password_reset.dto';
import { UpdatePasswordResetDto } from './dto/update-password_reset.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  PasswordReset,
  PasswordResetDocument,
} from './schemas/password_reset.schemas';
import { Model, Types } from 'mongoose';

@Injectable()
export class PasswordResetsService {
  constructor(
    @InjectModel(PasswordReset.name)
    private passWordResetModel: Model<PasswordResetDocument>,
  ) {}

  async create(
    createPasswordResetDto: CreatePasswordResetDto,
  ): Promise<PasswordReset> {
    const createPassWordReset = new this.passWordResetModel({
      ...createPasswordResetDto,
      user_id: new Types.ObjectId(createPasswordResetDto.user_id),
    });
    return createPassWordReset.save();
  }

  async findMany(userId: string) {
    return this.passWordResetModel
      .find({ user_id: new Types.ObjectId(userId) })
      .exec();
  }

  findAll() {
    return `This action returns all passwordResets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} passwordReset`;
  }

  async update(id: string, updatePasswordResetDto: UpdatePasswordResetDto) {
    return this.passWordResetModel
      .findByIdAndUpdate(id, updatePasswordResetDto, { new: true })
      .exec();
  }

  async remove(user_id: string) {
    const objectId = new Types.ObjectId(user_id);
    await this.passWordResetModel.deleteMany({ user_id: objectId }).exec();
  }
}
