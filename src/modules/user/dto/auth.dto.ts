import { z } from 'zod';
import { UserValidationSchema } from '../../../DB/model/user.model';

export const ResendOtpSchema = UserValidationSchema.pick({
  email: true,
}).required({
  email: true,
});

export type ResendOtpDto = z.infer<typeof ResendOtpSchema>;

export const GmailAuthSchema = z.object({
  idToken: z.string().trim().min(1),
});

export type GmailAuthDto = z.infer<typeof GmailAuthSchema>;

export const ForgetPasswordSchema = UserValidationSchema.pick({
  email: true,
}).required({
  email: true,
});

export type ForgetPasswordDto = z.infer<typeof ForgetPasswordSchema>;

export const ResetPasswordSchema = z.object({
  email: UserValidationSchema.shape.email,
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be 6 digits'),
  password: UserValidationSchema.shape.password,
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

export const UpdatePasswordSchema = z.object({
  oldPassword: UserValidationSchema.shape.password,
  password: UserValidationSchema.shape.password,
});

export type UpdatePasswordDto = z.infer<typeof UpdatePasswordSchema>;
