import bcrypt from 'bcrypt';
const saltRounds = 10;

export const hashPasswordHelper = async (
  plainPassword: string,
): Promise<string | undefined> => {
  try {
    return await bcrypt.hash(plainPassword, saltRounds);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const comparePasswordHelper = async (
  plainPassword: string,
  hashPassword: string,
): Promise<boolean | undefined> => {
  try {
    return await bcrypt.compare(plainPassword, hashPassword);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
