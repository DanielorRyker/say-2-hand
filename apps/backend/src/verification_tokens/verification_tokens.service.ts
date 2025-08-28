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

 async create(createVerificationTokenDto: CreateVerificationTokenDto): Promise<VerificationToken> {
    const createdToken = new this.tokenModel({
      ...createVerificationTokenDto,
      user_id: new Types.ObjectId(createVerificationTokenDto.user_id),
      
    });
    return createdToken.save();
  }

  async findAll() {
    this.tokenModel.find().exec();
  }

 async findOne(userId: string) {
  return this.tokenModel.findOne({ user_id: new Types.ObjectId(userId) }).exec();
}

 async findMany(userId: string) {
  return this.tokenModel.find({ user_id: new Types.ObjectId(userId) }).exec();
}

  update(id: number, updateVerificationTokenDto: UpdateVerificationTokenDto) {
    return `This action updates a #${id} verificationToken`;
  }

  async remove(user_id: string) {
    const objectId = new Types.ObjectId(user_id);
    await this.tokenModel.deleteMany({ user_id: objectId }).exec();
  }

  

  
}
