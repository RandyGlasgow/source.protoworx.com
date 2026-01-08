import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { VALID_EMAIL, VALID_PASSWORD, createValidUuid } from 'src/test-helpers/auth-test-helpers';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      verifyToken: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/sign-up', () => {
    it('should call service.signUp and return result', async () => {
      const dto = {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        name: 'Test User',
      };
      const expectedResult = { message: 'Verification email sent' };

      authService.signUp.mockResolvedValue(expectedResult);

      const result = await controller.signUp(dto);

      expect(authService.signUp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle sign-up without name', async () => {
      const dto = {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      };
      const expectedResult = { message: 'Verification email sent' };

      authService.signUp.mockResolvedValue(expectedResult);

      const result = await controller.signUp(dto);

      expect(authService.signUp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('POST /auth/sign-in', () => {
    it('should call service.signIn and return token + user', async () => {
      const dto = {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      };
      const expectedResult = {
        token: 'jwt-token',
        user: {
          id: '123',
          email: VALID_EMAIL,
          name: 'Test User',
          emailVerified: true as const,
        },
      };

      authService.signIn.mockResolvedValue(expectedResult);

      const result = await controller.signIn(dto);

      expect(authService.signIn).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('GET /auth/verify', () => {
    it('should extract token from Authorization header and call service', async () => {
      const authorization = 'Bearer test-token';
      const expectedResult = { valid: true };

      (authService.verifyToken as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.verify(authorization);

      expect(authService.verifyToken).toHaveBeenCalledWith({
        token: 'test-token',
      });
      expect(result).toEqual(expectedResult);
    });

    it('should handle missing Bearer prefix', async () => {
      const authorization = 'test-token';
      const expectedResult = { valid: true };

      (authService.verifyToken as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.verify(authorization);

      expect(authService.verifyToken).toHaveBeenCalledWith({
        token: 'test-token',
      });
      expect(result).toEqual(expectedResult);
    });

    it('should handle undefined authorization', async () => {
      const authorization = undefined as unknown as string;
      const expectedResult = { valid: false };

      (authService.verifyToken as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.verify(authorization);

      expect(authService.verifyToken).toHaveBeenCalledWith({
        token: '',
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should call service.verifyEmail with token', async () => {
      const dto = {
        token: createValidUuid(),
      };
      const expectedResult = { message: 'Email verified' };

      authService.verifyEmail.mockResolvedValue(expectedResult);

      const result = await controller.verifyEmail(dto);

      expect(authService.verifyEmail).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('POST /auth/resend-verification', () => {
    it('should call service.resendVerificationEmail', async () => {
      const dto = {
        email: VALID_EMAIL,
      };
      const expectedResult = { message: 'Verification email sent' };

      authService.resendVerificationEmail.mockResolvedValue(expectedResult);

      const result = await controller.resendVerification(dto);

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should call service.requestPasswordReset', async () => {
      const dto = {
        email: VALID_EMAIL,
      };
      const expectedResult = { message: 'Password reset email sent' };

      authService.requestPasswordReset.mockResolvedValue(expectedResult);

      const result = await controller.forgotPassword(dto);

      expect(authService.requestPasswordReset).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should call service.resetPassword', async () => {
      const dto = {
        token: createValidUuid(),
        newPassword: VALID_PASSWORD,
      };
      const expectedResult = { message: 'Password reset successful' };

      authService.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });
});
