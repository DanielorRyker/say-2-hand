import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { Post } from './schemas/post.schema';
import {
  mockPost,
  mockRepository,
  clearAllMocks,
} from '../../common/testing/test-utils';
import { NotFoundException } from '@nestjs/common';

/**
 * Task 30-34: Unit Tests cho Posts Service
 * Test các methods quan trọng của PostsService
 */

describe('PostsService', () => {
  let service: PostsService;
  let mockPostModel: any;

  beforeEach(async () => {
    // Setup mock model với chain methods
    mockPostModel = {
      ...mockRepository,
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken(Post.name),
          useValue: mockPostModel,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    clearAllMocks();
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a post when found', async () => {
      // Arrange
      mockPostModel.exec.mockResolvedValue(mockPost);

      // Act
      const result = await service.findOne(mockPost._id);

      // Assert
      expect(result).toEqual(mockPost);
      expect(mockPostModel.findById).toHaveBeenCalledWith(mockPost._id);
      expect(mockPostModel.populate).toHaveBeenCalledWith(
        'author_id',
        'full_name avatar',
      );
      expect(mockPostModel.populate).toHaveBeenCalledWith(
        'category_id',
        'name',
      );
      expect(mockPostModel.lean).toHaveBeenCalled();
    });

    it('should return null when post not found', async () => {
      // Arrange
      mockPostModel.exec.mockResolvedValue(null);

      // Act
      const result = await service.findOne('nonexistent_id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAllForHome', () => {
    it('should return paginated posts with default pagination', async () => {
      // Arrange
      const mockPosts = [mockPost, { ...mockPost, _id: 'different_id' }];
      mockPostModel.countDocuments.mockResolvedValue(2);
      mockPostModel.exec.mockResolvedValue(mockPosts);

      // Act
      const result = await service.findAllForHome();

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.totalItems).toBe(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(20);
      expect(mockPostModel.find).toHaveBeenCalledWith({
        status: { $in: ['active'] },
      });
    });

    it('should respect custom page and limit parameters', async () => {
      // Arrange
      const page = 2;
      const limit = 10;
      const mockPosts = [mockPost];
      mockPostModel.countDocuments.mockResolvedValue(25);
      mockPostModel.exec.mockResolvedValue(mockPosts);

      // Act
      await service.findAllForHome(page, limit);

      // Assert
      expect(mockPostModel.skip).toHaveBeenCalledWith(10); // (page - 1) * limit
      expect(mockPostModel.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('findByUserId', () => {
    it('should return paginated posts for a user', async () => {
      // Arrange
      const userId = mockPost.author_id;
      const mockPosts = [mockPost];
      mockPostModel.countDocuments.mockResolvedValue(1);
      mockPostModel.exec.mockResolvedValue(mockPosts);

      // Act
      const result = await service.findByUserId(userId);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
      expect(mockPostModel.populate).toHaveBeenCalledWith(
        'author_id',
        'full_name avatar reputation',
      );
    });

    it('should return empty array when user has no posts', async () => {
      // Arrange
      mockPostModel.countDocuments.mockResolvedValue(0);
      mockPostModel.exec.mockResolvedValue([]);

      // Act
      const result = await service.findByUserId('user_without_posts');

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  describe('removePost', () => {
    it('should throw NotFoundException when post not found', async () => {
      // Arrange
      mockPostModel.findById.mockReturnThis();
      mockPostModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removePost('nonexistent_id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete post when found', async () => {
      // Arrange
      const findByIdMock = jest.fn().mockResolvedValue(mockPost);
      mockPostModel.findById = findByIdMock;
      mockPostModel.exec.mockResolvedValue(mockPost);

      // Act
      await service.removePost(mockPost._id);

      // Assert
      expect(findByIdMock).toHaveBeenCalledWith(mockPost._id);
      expect(mockPostModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockPost._id,
      );
    });
  });

  describe('findByIds', () => {
    it('should return posts matching given IDs', async () => {
      // Arrange
      const ids = [mockPost._id, 'another_id'];
      const mockPosts = [mockPost];
      mockPostModel.exec.mockResolvedValue(mockPosts);

      // Act
      const result = await service.findByIds(ids);

      // Assert
      expect(result).toEqual(mockPosts);
      expect(mockPostModel.find).toHaveBeenCalled();
      expect(mockPostModel.populate).toHaveBeenCalledWith(
        'author_id',
        'full_name avatar',
      );
      expect(mockPostModel.lean).toHaveBeenCalled();
    });
  });

  describe('countsByProvince', () => {
    it('should return post counts grouped by province', async () => {
      // Arrange
      const mockCounts = [
        { province: 'Hồ Chí Minh', count: 10 },
        { province: 'Hà Nội', count: 5 },
      ];
      mockPostModel.aggregate.mockResolvedValue(mockCounts);

      // Act
      const result = await service.countsByProvince();

      // Assert
      expect(result).toEqual(mockCounts);
      expect(mockPostModel.aggregate).toHaveBeenCalled();
    });
  });
});
