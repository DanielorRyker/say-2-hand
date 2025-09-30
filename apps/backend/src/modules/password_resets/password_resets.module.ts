import { Module } from '@nestjs/common';
import { PasswordResetsService } from './password_resets.service';
import { PasswordResetsController } from './password_resets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PasswordReset,
  PasswordResetSchema,
} from './schemas/password_reset.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PasswordReset.name,
        schema: PasswordResetSchema,
        collection: 'password_resets',
      },
    ]),
  ],
  controllers: [PasswordResetsController],
  providers: [PasswordResetsService],
  exports: [PasswordResetsService],
})
export class PasswordResetsModule {}
