import type { User } from './domain/user.entity';

interface PublicUser {
  id: string;
  email: string;
  username: string;
}

export const toPublicUser = (u: User): PublicUser => {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
  };
};
