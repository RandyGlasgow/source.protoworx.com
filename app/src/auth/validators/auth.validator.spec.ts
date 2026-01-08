import {
  signUpSchema,
  signInSchema,
  verifyTokenSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  validateUserSchema,
} from './auth.validator';

describe('Auth Validators', () => {
  describe('signUpSchema', () => {
    it('should validate valid sign-up data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        name: 'Test User',
      };
      expect(() => signUpSchema.parse(validData)).not.toThrow();
    });

    it('should validate sign-up without optional name', () => {
      const validData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };
      expect(() => signUpSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'ValidPass123!',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });

    it('should reject password without uppercase', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'validpass123!',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });

    it('should reject password without lowercase', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'VALIDPASS123!',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });

    it('should reject password without number', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'ValidPass!',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });

    it('should reject password without special character', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'ValidPass123',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Val1!',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'ValidPass123!',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });

    it('should reject name longer than 100 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        name: 'a'.repeat(101),
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });
  });

  describe('signInSchema', () => {
    it('should validate valid sign-in data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      };
      expect(() => signInSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password',
      };
      expect(() => signInSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };
      expect(() => signInSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password',
      };
      expect(() => signInSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };
      expect(() => signInSchema.parse(invalidData)).toThrow();
    });
  });

  describe('verifyTokenSchema', () => {
    it('should validate valid token', () => {
      const validData = {
        token: 'any-token-string',
      };
      expect(() => verifyTokenSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty token', () => {
      const invalidData = {
        token: '',
      };
      expect(() => verifyTokenSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing token', () => {
      const invalidData = {};
      expect(() => verifyTokenSchema.parse(invalidData)).toThrow();
    });
  });

  describe('verifyEmailSchema', () => {
    it('should validate valid UUID token', () => {
      const validData = {
        token: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => verifyEmailSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        token: 'not-a-uuid',
      };
      expect(() => verifyEmailSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty token', () => {
      const invalidData = {
        token: '',
      };
      expect(() => verifyEmailSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing token', () => {
      const invalidData = {};
      expect(() => verifyEmailSchema.parse(invalidData)).toThrow();
    });
  });

  describe('requestPasswordResetSchema', () => {
    it('should validate valid email', () => {
      const validData = {
        email: 'test@example.com',
      };
      expect(() => requestPasswordResetSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
      };
      expect(() => requestPasswordResetSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing email', () => {
      const invalidData = {};
      expect(() => requestPasswordResetSchema.parse(invalidData)).toThrow();
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate valid reset password data', () => {
      const validData = {
        token: '550e8400-e29b-41d4-a716-446655440000',
        newPassword: 'NewValidPass123!',
      };
      expect(() => resetPasswordSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid UUID token', () => {
      const invalidData = {
        token: 'not-a-uuid',
        newPassword: 'NewValidPass123!',
      };
      expect(() => resetPasswordSchema.parse(invalidData)).toThrow();
    });

    it('should reject weak password', () => {
      const invalidData = {
        token: '550e8400-e29b-41d4-a716-446655440000',
        newPassword: 'weak',
      };
      expect(() => resetPasswordSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing token', () => {
      const invalidData = {
        newPassword: 'NewValidPass123!',
      };
      expect(() => resetPasswordSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing password', () => {
      const invalidData = {
        token: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => resetPasswordSchema.parse(invalidData)).toThrow();
    });
  });

  describe('resendVerificationSchema', () => {
    it('should validate valid email', () => {
      const validData = {
        email: 'test@example.com',
      };
      expect(() => resendVerificationSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
      };
      expect(() => resendVerificationSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing email', () => {
      const invalidData = {};
      expect(() => resendVerificationSchema.parse(invalidData)).toThrow();
    });
  });

  describe('validateUserSchema', () => {
    it('should validate valid user data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      };
      expect(() => validateUserSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password',
      };
      expect(() => validateUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };
      expect(() => validateUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password',
      };
      expect(() => validateUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };
      expect(() => validateUserSchema.parse(invalidData)).toThrow();
    });
  });
});
