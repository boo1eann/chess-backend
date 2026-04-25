import { EmailSchema, PasswordSchema, UsernameSchema } from '@/shared/validators/primitives';
import z from 'zod';

export const RegisterInputSchema = z.object({
  body: z
    .object({
      username: UsernameSchema,
      email: EmailSchema,
      password: PasswordSchema,
      passwordConfirm: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      error: 'Passwords do not match',
      path: ['passwordConfirm'],
    }),
});

export const LoginInputSchema = z.object({
  body: z.object({
    login: z.string().min(1, 'Login is required').max(255, 'Login is too long').trim(),
    password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
  }),
});

export type RegisterInput = Omit<z.infer<typeof RegisterInputSchema>['body'], 'passwordConfirm'>;
export type LoginInput = z.infer<typeof LoginInputSchema>['body'];
