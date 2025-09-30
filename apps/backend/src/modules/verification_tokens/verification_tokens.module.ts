import { Module } from '@nestjs/common';
import { VerificationTokensService } from './verification_tokens.service';
import { VerificationTokensController } from './verification_tokens.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VerificationToken,
  TokenSchema,
} from './schemas/verification_token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: VerificationToken.name,
        schema: TokenSchema,
        collection: 'verification_tokens',
      },
    ]),
  ],
  controllers: [VerificationTokensController],
  providers: [VerificationTokensService],
  exports: [VerificationTokensService],
})
export class VerificationTokensModule {}
