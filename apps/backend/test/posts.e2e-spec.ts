import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { mockPost } from '../src/common/testing/test-utils';

/**
 * Task 30-34: E2E Tests cho Posts API
 * Test integration của toàn bộ Posts endpoints
 */

describe('PostsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Setup validation pipes giống production
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // TODO: Login để lấy auth token
    // const loginResponse = await request(app.getHttpServer())
    //   .post('/auth/login')
    //   .send({ email: mockUser.email, password: 'password' });
    // authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/posts (GET)', () => {
    it('should return all posts', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/posts/postmap (GET)', () => {
    it('should return paginated active posts', () => {
      return request(app.getHttpServer())
        .get('/posts/postmap')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(res.body.pagination).toHaveProperty('currentPage');
          expect(res.body.pagination).toHaveProperty('totalItems');
          expect(res.body.pagination.currentPage).toBe(1);
        });
    });

    it('should validate pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/posts/postmap')
        .query({ page: -1, limit: 200 }) // Invalid: page < 1, limit > 100
        .expect(400);
    });
  });

  describe('/posts/active (GET)', () => {
    it('should return only active posts', () => {
      return request(app.getHttpServer())
        .get('/posts/active')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('status', 'active');
          }
        });
    });
  });

  describe('/posts/:id (GET)', () => {
    it('should return a post by ID', async () => {
      // First get a valid post ID
      const postsResponse = await request(app.getHttpServer())
        .get('/posts/active')
        .expect(200);

      if (postsResponse.body.length > 0) {
        const postId = postsResponse.body[0]._id;

        return request(app.getHttpServer())
          .get(`/posts/${postId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('_id', postId);
            expect(res.body).toHaveProperty('title');
            expect(res.body).toHaveProperty('price');
          });
      }
    });

    it('should return null for non-existent post', () => {
      const fakeId = '507f1f77bcf86cd799439099';
      return request(app.getHttpServer())
        .get(`/posts/${fakeId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeNull();
        });
    });
  });

  describe('/posts/user/:userId (GET)', () => {
    it('should return paginated posts for a user', async () => {
      // Get a valid user ID first
      const postsResponse = await request(app.getHttpServer())
        .get('/posts/active')
        .expect(200);

      if (postsResponse.body.length > 0) {
        const userId =
          postsResponse.body[0].author_id._id ||
          postsResponse.body[0].author_id;

        return request(app.getHttpServer())
          .get(`/posts/user/${userId}`)
          .query({ page: 1, limit: 5 })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('pagination');
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      }
    });
  });

  describe('/posts/counts/province (GET)', () => {
    it('should return post counts by province', () => {
      return request(app.getHttpServer())
        .get('/posts/counts/province')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('province');
            expect(res.body[0]).toHaveProperty('count');
            expect(typeof res.body[0].count).toBe('number');
          }
        });
    });
  });

  describe('/posts (POST)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send(mockPost)
        .expect(401); // Unauthorized without JWT token
    });

    // TODO: Add authenticated tests when auth is setup
    // it('should create a new post with valid data', () => {
    //   return request(app.getHttpServer())
    //     .post('/posts')
    //     .set('Authorization', `Bearer ${authToken}`)
    //     .send(mockPost)
    //     .expect(201);
    // });
  });

  describe('/posts/:id (PATCH)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .patch('/posts/507f1f77bcf86cd799439011')
        .send({ title: 'Updated Title' })
        .expect(401);
    });
  });

  describe('/posts/:id (DELETE)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .delete('/posts/507f1f77bcf86cd799439011')
        .expect(401);
    });
  });
});
