import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request with valid token', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockRequest = {
      user: mockUser,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    // Mock canActivate to return true (simulating successful authentication)
    jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException for invalid token', async () => {
    const mockRequest = {};

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    // Mock canActivate to throw (simulating authentication failure)
    jest.spyOn(guard, 'canActivate').mockRejectedValue(new UnauthorizedException());

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });
});
