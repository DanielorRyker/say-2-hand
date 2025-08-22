import { Test, TestingModule } from '@nestjs/testing';
import { VerificationTokensService } from './verification_tokens.service';

describe('VerificationTokensService', () => {
  let service: VerificationTokensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerificationTokensService],
    }).compile();

    service = module.get<VerificationTokensService>(VerificationTokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
