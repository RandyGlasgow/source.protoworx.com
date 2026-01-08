import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { VerifiedUserGuard } from './verified-user.guard';
import { createTestUserWithAuth } from 'src/test-helpers/auth-test-helpers';

describe('VerifiedUserGuard', () => {
  let guard: VerifiedUserGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifiedUserGuard],
    }).compile();

    guard = module.get<VerifiedUserGuard>(VerifiedUserGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request with verified user', () => {
    const { user, auth } = createTestUserWithAuth(undefined, { emailVerified: true });
    const mockRequest = {
      user: {
        ...user,
        auth,
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if no user in request', () => {
    const mockRequest = {};

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow('User not authenticated');
  });

  it('should throw UnauthorizedException if email not verified', () => {
    const { user, auth } = createTestUserWithAuth(undefined, { emailVerified: false });
    const mockRequest = {
      user: {
        ...user,
        auth,
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow('Email not verified');
  });

  it('should throw UnauthorizedException if user has no auth record', () => {
    const user = createTestUserWithAuth().user;
    const mockRequest = {
      user: {
        ...user,
        auth: null,
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext)).toThrow('Email not verified');
  });
});
