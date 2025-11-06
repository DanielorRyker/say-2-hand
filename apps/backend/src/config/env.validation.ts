import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Server
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  MONGODB_URI: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // Frontend
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3002'),

  // Email
  MAIL_USER: Joi.string().email().required(),
  MAIL_PASSWORD: Joi.string().required(),

  // Google Cloud Storage (optional trong development)
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().optional(),
  GCS_BUCKET_NAME: Joi.string().default('say2hand'),

  // Redis (optional trong development)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),

  // Optional
  ADMIN_EMAIL: Joi.string().email().optional(),
});
