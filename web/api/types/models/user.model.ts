export type User = {
  id: string;
  email: string;
  name?: string;
  username?: string;
  hasOnboarded: boolean;
  auth: {
    emailVerified: boolean;
  };
};
