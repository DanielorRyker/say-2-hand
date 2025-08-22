import { Test, TestingModule } from '@nestjs/testing';
import { VerificationTokensController } from './verification_tokens.controller';
import { VerificationTokensService } from './verification_tokens.service';

describe('VerificationTokensController', () => {
  let controller: VerificationTokensController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerificationTokensController],
      providers: [VerificationTokensService],
    }).compile();

    controller = module.get<VerificationTokensController>(VerificationTokensController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
