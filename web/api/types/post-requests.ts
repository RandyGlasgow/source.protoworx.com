import { User } from './models/user.model';

export type PostRequests = {
  '/auth/sign-up': {
    body: {
      email: string;
      name?: string;
      password: string;
    };
    response: { message: string };
  };
  '/auth/sign-in': {
    body: {
      email: string;
      password: string;
    };
    response: {
      data: {
        token: string;
        user: User;
      };
    };
  };
  '/auth/verify-email': {
    body: {
      token: string;
    };
    response: {
      message: string;
      token: string;
      user: {
        id: string;
        email: string;
        name: string | null;
        username: string | null;
        hasOnboarded: boolean;
        emailVerified: boolean;
      };
    };
  };
  '/auth/resend-verification': {
    body: {
      email: string;
    };
    response: { message: string };
  };
  '/auth/forgot-password': {
    body: {
      email: string;
    };
    response: { message: string };
  };
  '/auth/reset-password': {
    body: {
      token: string;
      newPassword: string;
    };
    response: { message: string };
  };
  '/auth/onboarding': {
    body: {
      username: string;
    };
    response: {
      message: string;
      user: User;
    };
  };
};
