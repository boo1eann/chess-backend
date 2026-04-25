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

export type RegisterInput = Omit<z.infer<typeof RegisterInputSchema>['body'], 'passwordConfirm'>;
