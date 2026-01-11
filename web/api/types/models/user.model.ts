export type User = {
  id: string;
  email: string;
  name?: string;
  username?: string;
  hasOnboarded: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};
