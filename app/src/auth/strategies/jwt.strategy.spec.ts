import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { createTestUserWithAuth } from 'src/test-helpers/auth-test-helpers';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtStrategy } from './jwt.strategy';

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

  it('should return user with auth for valid payload', async () => {
    const { user, auth } = createTestUserWithAuth();
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      ...user,
      auth,
    });

    const result = await strategy.validate(payload);

    expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
      where: { id: payload.userId },
      include: { auth: true },
    });
    expect(result).toEqual({
      ...user,
      auth,
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

  it('should load user with auth relation', async () => {
    const { user, auth } = createTestUserWithAuth();
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      ...user,
      auth,
    });

    await strategy.validate(payload);

    expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
      where: { id: payload.userId },
      include: { auth: true },
    });
  });
});
