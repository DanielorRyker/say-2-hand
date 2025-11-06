import bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

const saltRounds = 10;
const logger = new Logger('PasswordHelper');

export const hashPasswordHelper = async (
  plainPassword: string,
): Promise<string> => {
  try {
    return await bcrypt.hash(plainPassword, saltRounds);
  } catch (error) {
    logger.error('Error hashing password', error);
    throw new Error('Failed to hash password');
  }
};

export const comparePasswordHelper = async (
  plainPassword: string,
  hashPassword: string,
): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hashPassword);
  } catch (error) {
    logger.error('Error comparing password', error);
    throw new Error('Failed to compare password');
  }
};
