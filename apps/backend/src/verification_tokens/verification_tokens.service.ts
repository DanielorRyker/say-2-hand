import { Injectable } from '@nestjs/common';
import { CreateVerificationTokenDto } from './dto/create-verification_token.dto';
import { UpdateVerificationTokenDto } from './dto/update-verification_token.dto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { VerificationToken, TokenDocument } from './schemas/verification_token.schema';

@Injectable()
export class VerificationTokensService {
  constructor(
    @InjectModel(VerificationToken.name) private tokenModel: Model<TokenDocument>,
    ) {}

  create(createVerificationTokenDto: CreateVerificationTokenDto) {
    return 'This action adds a new verificationToken';
  }

  findAll() {
    this.tokenModel.find().exec();
  }

  findOne(userId: string) {
   return this.tokenModel.findOne({ user_id: new Types.ObjectId(userId) }).exec();
  }

  update(id: number, updateVerificationTokenDto: UpdateVerificationTokenDto) {
    return `This action updates a #${id} verificationToken`;
  }

  remove(id: number) {
    return `This action removes a #${id} verificationToken`;
  }
}
