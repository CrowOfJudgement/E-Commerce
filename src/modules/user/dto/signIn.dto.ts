import { z } from 'zod';
import { UserValidationSchema } from '../../../DB/model/user.model';

export const SignInSchema = UserValidationSchema.pick({
  email: true,
  password: true,
}).required({
  email: true,
  password: true,
});

export type SignInDto = z.infer<typeof SignInSchema>;
