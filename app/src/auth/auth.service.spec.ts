import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResendService } from 'src/resend/resend.service';
import { createTestUserWithAuth, VALID_PASSWORD, VALID_EMAIL, createValidUuid } from 'src/test-helpers/auth-test-helpers';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let resendService: jest.Mocked<ResendService>;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn() as jest.Mock,
        create: jest.fn() as jest.Mock,
      },
      auth: {
        findFirst: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockResendService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ResendService,
          useValue: mockResendService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    resendService = module.get(ResendService) as jest.Mocked<ResendService>;

    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRATION') return '30d';
      if (key === 'BCRYPT_ROUNDS') return 10;
      if (key === 'APP_URL') return 'http://localhost:3000';
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Utility Methods', () => {
    describe('hashPassword', () => {
      it('should hash password using bcrypt', async () => {
        const password = 'TestPassword123!';
        const hash = await service.hashPassword(password);
        
        expect(hash).toBeDefined();
        expect(hash).not.toBe(password);
        expect(hash.startsWith('$2b$')).toBe(true);
      });

      it('should produce different hashes for same password', async () => {
        const password = 'TestPassword123!';
        const hash1 = await service.hashPassword(password);
        const hash2 = await service.hashPassword(password);
        
        expect(hash1).not.toBe(hash2);
      });

      it('should verify hashed password correctly', async () => {
        const password = 'TestPassword123!';
        const hash = await service.hashPassword(password);
        const isValid = await bcrypt.compare(password, hash);
        
        expect(isValid).toBe(true);
      });
    });

    describe('generateEmailVerificationToken', () => {
      it('should generate UUID v4 token', () => {
        const token = service.generateEmailVerificationToken();
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        // UUID v4 format: 8-4-4-4-12 hex characters
        expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });

      it('should generate unique tokens', () => {
        const token1 = service.generateEmailVerificationToken();
        const token2 = service.generateEmailVerificationToken();
        
        expect(token1).not.toBe(token2);
      });
    });

    describe('generatePasswordResetToken', () => {
      it('should generate UUID v4 token', () => {
        const token = service.generatePasswordResetToken();
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });

      it('should generate unique tokens', () => {
        const token1 = service.generatePasswordResetToken();
        const token2 = service.generatePasswordResetToken();
        
        expect(token1).not.toBe(token2);
      });
    });
  });

  describe('signUp', () => {
    it('should create user and auth record, send verification email', async () => {
      const { user, auth } = createTestUserWithAuth();
      const verificationToken = createValidUuid();
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        ...user,
        auth,
      });
      resendService.sendVerificationEmail.mockResolvedValue({ id: 'email-id' });
      
      // Mock the token generation
      jest.spyOn(service, 'generateEmailVerificationToken').mockReturnValue(verificationToken);

      const result = await service.signUp({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        name: 'Test User',
      });

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { email: VALID_EMAIL },
      });
      expect(prismaService.user.create as jest.Mock).toHaveBeenCalled();
      expect(resendService.sendVerificationEmail).toHaveBeenCalledWith(
        VALID_EMAIL,
        verificationToken,
      );
      expect(result).toEqual({ message: 'Verification email sent' });
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = createTestUserWithAuth().user;
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      await expect(
        service.signUp({
          email: VALID_EMAIL,
          password: VALID_PASSWORD,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid input', async () => {
      await expect(
        service.signUp({
          email: 'invalid-email',
          password: 'weak',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('signIn', () => {
    it('should return JWT token and user data for valid credentials', async () => {
      const { user, auth } = createTestUserWithAuth(undefined, { emailVerified: true });
      const token = 'jwt-token';
      const passwordHash = await bcrypt.hash('password123', 10);
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...user,
        auth: { ...auth, passwordHash },
      });
      jwtService.sign.mockReturnValue(token);

      const result = await service.signIn({
        email: VALID_EMAIL,
        password: 'password123',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
      });
      expect(result).toHaveProperty('token', token);
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const { user, auth } = createTestUserWithAuth(undefined, { emailVerified: true });
      const passwordHash = await bcrypt.hash('correctpassword', 10);
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...user,
        auth: { ...auth, passwordHash },
      });

      await expect(
        service.signIn({
          email: VALID_EMAIL,
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email not verified', async () => {
      const { user, auth } = createTestUserWithAuth(undefined, { emailVerified: false });
      const passwordHash = await bcrypt.hash('password123', 10);
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...user,
        auth: { ...auth, passwordHash },
      });

      await expect(
        service.signIn({
          email: VALID_EMAIL,
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for invalid input', async () => {
      await expect(
        service.signIn({
          email: 'invalid-email',
          password: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyToken', () => {
    it('should return { valid: true } for valid token', () => {
      const token = 'valid-token';
      jwtService.verify.mockReturnValue({ userId: '123', email: 'test@example.com' });

      const result = service.verifyToken({ token });

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(result).toEqual({ valid: true });
    });

    it('should return { valid: false } for invalid token', () => {
      const token = 'invalid-token';
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = service.verifyToken({ token });

      expect(result).toEqual({ valid: false });
    });

    it('should handle Bearer prefix in token', () => {
      const token = 'Bearer valid-token';
      jwtService.verify.mockReturnValue({ userId: '123', email: 'test@example.com' });

      const result = service.verifyToken({ token });

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({ valid: true });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and clear token', async () => {
      const token = createValidUuid();
      const { user, auth } = createTestUserWithAuth();
      const authWithToken = {
        ...auth,
        emailVerificationToken: token,
        emailVerificationTokenExpires: new Date(Date.now() + 3600000),
      };

      (prismaService.auth.findFirst as jest.Mock).mockResolvedValue({
        ...authWithToken,
        user,
      });
      (prismaService.auth.update as jest.Mock).mockResolvedValue({
        ...authWithToken,
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      });

      const result = await service.verifyEmail({ token });

      expect(prismaService.auth.findFirst as jest.Mock).toHaveBeenCalledWith({
        where: { emailVerificationToken: token },
        include: { user: true },
      });
      expect(prismaService.auth.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: auth.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpires: null,
        },
      });
      expect(result).toEqual({ message: 'Email verified' });
    });

    it('should throw BadRequestException for invalid token', async () => {
      (prismaService.auth.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.verifyEmail({ token: createValidUuid() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired token', async () => {
      const token = createValidUuid();
      const { user, auth } = createTestUserWithAuth();
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1);

      (prismaService.auth.findFirst as jest.Mock).mockResolvedValue({
        ...auth,
        emailVerificationToken: token,
        emailVerificationTokenExpires: expiredDate,
        user,
      });

      await expect(
        service.verifyEmail({ token }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('requestPasswordReset', () => {
    it('should generate reset token and send email', async () => {
      const { user, auth } = createTestUserWithAuth();
      const resetToken = createValidUuid();

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...user,
        auth,
      });
      (prismaService.auth.update as jest.Mock).mockResolvedValue({
        ...auth,
        passwordResetToken: resetToken,
      });
      resendService.sendPasswordResetEmail.mockResolvedValue({ id: 'email-id' });
      jest.spyOn(service, 'generatePasswordResetToken').mockReturnValue(resetToken);

      const result = await service.requestPasswordReset({ email: VALID_EMAIL });

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { email: VALID_EMAIL },
        include: { auth: true },
      });
      expect(resendService.sendPasswordResetEmail).toHaveBeenCalledWith(
        VALID_EMAIL,
        resetToken,
      );
      expect(result).toEqual({ message: 'Password reset email sent' });
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.requestPasswordReset({ email: VALID_EMAIL }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if rate limited', async () => {
      const { user, auth } = createTestUserWithAuth();
      // Set last request to 30 minutes ago (within 1 hour window, so should be rate limited)
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...user,
        auth: {
          ...auth,
          passwordResetRequestCount: 3,
          passwordResetLastRequestAt: thirtyMinutesAgo,
        },
      });

      await expect(
        service.requestPasswordReset({ email: VALID_EMAIL }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password and clear token', async () => {
      const token = createValidUuid();
      const { user, auth } = createTestUserWithAuth();
      const authWithToken = {
        ...auth,
        passwordResetToken: token,
        passwordResetTokenExpires: new Date(Date.now() + 3600000),
      };

      (prismaService.auth.findFirst as jest.Mock).mockResolvedValue({
        ...authWithToken,
        user,
      });
      (prismaService.auth.update as jest.Mock).mockResolvedValue({
        ...authWithToken,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
      });

      const result = await service.resetPassword({
        token,
        newPassword: VALID_PASSWORD,
      });

      expect(prismaService.auth.update as jest.Mock).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Password reset successful' });
    });

    it('should throw BadRequestException for invalid token', async () => {
      (prismaService.auth.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: createValidUuid(),
          newPassword: VALID_PASSWORD,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired token', async () => {
      const token = createValidUuid();
      const { user, auth } = createTestUserWithAuth();
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1);

      (prismaService.auth.findFirst as jest.Mock).mockResolvedValue({
        ...auth,
        passwordResetToken: token,
        passwordResetTokenExpires: expiredDate,
        user,
      });

      await expect(
        service.resetPassword({
          token,
          newPassword: VALID_PASSWORD,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend email with existing valid token', async () => {
      const { user, auth } = createTestUserWithAuth();
      const token = createValidUuid();
      const authWithToken = {
        ...auth,
        emailVerificationToken: token,
        emailVerificationTokenExpires: new Date(Date.now() + 3600000),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...user,
        auth: authWithToken,
      });
      resendService.sendVerificationEmail.mockResolvedValue({ id: 'email-id' });

      const result = await service.resendVerificationEmail({ email: VALID_EMAIL });

      expect(resendService.sendVerificationEmail).toHaveBeenCalledWith(
        VALID_EMAIL,
        token,
      );
      expect(result).toEqual({ message: 'Verification email sent' });
    });

    it('should generate new token if expired', async () => {
      const { user, auth } = createTestUserWithAuth();
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1);
      const newToken = createValidUuid();

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...user,
        auth: {
          ...auth,
          emailVerificationToken: 'old-token',
          emailVerificationTokenExpires: expiredDate,
        },
      });
      (prismaService.auth.update as jest.Mock).mockResolvedValue({
        ...auth,
        emailVerificationToken: newToken,
      });
      resendService.sendVerificationEmail.mockResolvedValue({ id: 'email-id' });
      jest.spyOn(service, 'generateEmailVerificationToken').mockReturnValue(newToken);

      await service.resendVerificationEmail({ email: VALID_EMAIL });

      expect(prismaService.auth.update as jest.Mock).toHaveBeenCalled();
      expect(resendService.sendVerificationEmail).toHaveBeenCalledWith(
        VALID_EMAIL,
        newToken,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.resendVerificationEmail({ email: VALID_EMAIL }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      const { user, auth } = createTestUserWithAuth();
      const passwordHash = await bcrypt.hash('password123', 10);

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...user,
        auth: { ...auth, passwordHash },
      });

      const result = await service.validateUser({
        email: VALID_EMAIL,
        password: 'password123',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
    });

    it('should return null for invalid password', async () => {
      const { user, auth } = createTestUserWithAuth();
      const passwordHash = await bcrypt.hash('correctpassword', 10);

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...user,
        auth: { ...auth, passwordHash },
      });

      const result = await service.validateUser({
        email: VALID_EMAIL,
        password: 'wrongpassword',
      });

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser({
        email: VALID_EMAIL,
        password: 'password123',
      });

      expect(result).toBeNull();
    });
  });
});
