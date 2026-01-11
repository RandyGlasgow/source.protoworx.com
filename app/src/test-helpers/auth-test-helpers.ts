import { randomUUID } from 'crypto';
import {
  User,
  Auth,
  UserProfile,
  TemporaryUserToken,
  TemporaryUserTokenType,
} from 'generated/prisma/client';

export const createTestUser = (overrides?: Partial<User>): User => {
  return {
    id: randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createTestAuth = (
  userId: string,
  overrides?: Partial<Auth>,
): Auth => {
  return {
    id: randomUUID(),
    userId,
    passwordHash: '$2b$10$hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createTestUserProfile = (
  userId: string,
  overrides?: Partial<UserProfile>,
): UserProfile => {
  return {
    id: randomUUID(),
    userId,
    emailVerified: false,
    onboardingComplete: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createTestTemporaryUserToken = (
  userId: string,
  type: TemporaryUserTokenType,
  overrides?: Partial<TemporaryUserToken>,
): TemporaryUserToken => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);
  return {
    id: randomUUID(),
    userId,
    type,
    token: randomUUID(),
    expiresAt,
    meta: null,
    createdAt: new Date(),
    ...overrides,
  };
};

export const createTestUserWithAuth = (
  userOverrides?: Partial<User>,
  authOverrides?: Partial<Auth>,
  profileOverrides?: Partial<UserProfile>,
) => {
  const user = createTestUser(userOverrides);
  const auth = createTestAuth(user.id, authOverrides);
  const profile = createTestUserProfile(user.id, profileOverrides);
  return { user, auth, profile };
};

export const createValidJwtToken = (): string => {
  // This is a mock token - in real tests, use JwtService to generate
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3OC05MGFiLWNkZWYtMTIzNC01Njc4OTBhYmNkZWYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.mock-signature';
};

export const createValidUuid = (): string => {
  return randomUUID();
};

export const createExpiredDate = (): Date => {
  const date = new Date();
  date.setHours(date.getHours() - 1);
  return date;
};

export const createFutureDate = (hoursFromNow = 48): Date => {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date;
};

export const VALID_PASSWORD = 'ValidPass123!';
export const WEAK_PASSWORD = 'weak';
export const VALID_EMAIL = 'test@example.com';
export const INVALID_EMAIL = 'invalid-email';
