import { z } from 'zod';
import { UserValidationSchema } from '../../../DB/model/user.model';

export const CreateUserSchema = UserValidationSchema.pick({
  userName: true,
  email: true,
  password: true,
  phone: true,
  age: true,
  address: true,
  profilePic: true,
  gender: true,
}).required({
  userName: true,
  email: true,
  password: true,
  phone: true,
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
