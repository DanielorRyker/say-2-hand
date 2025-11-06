import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

/**
 * Task 30-34: Test utilities và setup helpers
 * Helper functions để setup testing environment
 */

/**
 * Tạo testing module với MongoDB in-memory
 */
export async function createTestingModule(
  imports: any[] = [],
  providers: any[] = [],
) {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      ...imports,
    ],
    providers,
  }).compile();

  return module;
}

/**
 * Setup validation pipe cho testing
 */
export function setupTestValidation(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

/**
 * Mock data generators
 */
export const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  full_name: 'Test User',
  phone_number: '0123456789',
  avatar: 'https://example.com/avatar.jpg',
  status: 'active',
  role: 'user',
  reputation: {
    total_score: 5,
    total_ratings: 1,
  },
};

export const mockPost = {
  _id: '507f1f77bcf86cd799439012',
  title: 'Test Post',
  description: 'Test Description',
  price: 100000,
  images: ['https://example.com/image1.jpg'],
  category_id: '507f1f77bcf86cd799439013',
  author_id: '507f1f77bcf86cd799439011',
  status: 'active',
  transaction_type: 'sell',
  condition: 'used',
  location: {
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
  },
};

export const mockTransaction = {
  _id: '507f1f77bcf86cd799439014',
  buyer_id: '507f1f77bcf86cd799439011',
  seller_id: '507f1f77bcf86cd799439015',
  post_id: '507f1f77bcf86cd799439012',
  transaction_ref: 'MOMO202508120001',
  status: 'pending',
  payment_status: 'pending',
  amount: 100000,
};

/**
 * Mock repository functions
 */
export const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  exec: jest.fn(),
  lean: jest.fn(),
  populate: jest.fn(),
  sort: jest.fn(),
  skip: jest.fn(),
  limit: jest.fn(),
};

/**
 * Clear all mocks after each test
 */
export function clearAllMocks() {
  Object.values(mockRepository).forEach((fn) => {
    if (jest.isMockFunction(fn)) {
      fn.mockClear();
    }
  });
}
