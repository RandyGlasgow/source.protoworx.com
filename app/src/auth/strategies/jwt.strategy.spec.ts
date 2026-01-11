import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { createTestUserWithAuth } from 'src/test-helpers/auth-test-helpers';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);

    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return user with auth and profile for valid payload', async () => {
    const { user, auth, profile } = createTestUserWithAuth();
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      ...user,
      auth,
      profile,
    });

    const result = await strategy.validate(payload);

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
      where: { id: payload.userId },
      include: { auth: true, profile: true },
    });
    expect(result).toEqual({
      ...user,
      auth,
      profile,
    });
  });

  it('should throw UnauthorizedException if user not found', async () => {
    const payload: JwtPayload = {
      userId: 'non-existent-id',
      email: 'test@example.com',
    };

    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(strategy.validate(payload)).rejects.toThrow('User not found');
  });

  it('should throw UnauthorizedException if user has no auth record', async () => {
    const user = createTestUserWithAuth().user;
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      ...user,
      auth: null,
    });

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(strategy.validate(payload)).rejects.toThrow('User not found');
  });

  it('should load user with auth and profile relations', async () => {
    const { user, auth, profile } = createTestUserWithAuth();
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      ...user,
      auth,
      profile,
    });

    await strategy.validate(payload);

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
      where: { id: payload.userId },
      include: { auth: true, profile: true },
    });
  });
});
