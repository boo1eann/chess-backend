import z from 'zod';

export const emailSchema = z.string('Email is required').trim().toLowerCase().email;

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'moderator',
  'mod',
  'support',
  'staff',
  'root',
  'system',
  'null',
  'undefined',
  'anonymous',
  'guest',
]);

export const UsernameSchema = z
  .string({
    error: (iss) =>
      iss.input === undefined ? 'Username is required' : 'Username must be a string',
  })
  .trim()
  .min(3, { error: 'Username must be at least 3 characters' })
  .max(20, { error: 'Username must be at most 20 characters' })
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, {
    error: 'Username must start with a letter and contain only letters, digits, _ or -',
  })
  .refine((name) => !RESERVED_USERNAMES.has(name.toLowerCase()), {
    error: 'This username is reserved',
  });

export const EmailSchema = z
  .email({
    error: (iss) => (iss.input === undefined ? 'Email is required' : 'Invalid email address'),
  })
  .trim()
  .toLowerCase()
  .max(254, { error: 'Email must be at most 254 characters' });

export const PasswordSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined ? 'Password is required' : 'Password must be a string',
  })
  .min(12, { error: 'Password must be at least 12 characters' })
  .max(128, { error: 'Password must be at most 128 characters' })
  .refine((pw) => /[a-z]/.test(pw), { error: 'Must contain a lowercase letter' })
  .refine((pw) => /[A-Z]/.test(pw), { error: 'Must contain an uppercase letter' })
  .refine((pw) => /[0-9]/.test(pw), { error: 'Must contain a digit' });
