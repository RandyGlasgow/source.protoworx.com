import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ResendModule } from 'src/resend/resend.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ResendModule,
    PassportModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],

      useFactory: (configService: ConfigService) => {
        const expiration = configService.get<string>('JWT_EXPIRATION') || '30d';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          secret: configService.get<string>('JWT_SECRET') || 'secret',
          signOptions: {
            expiresIn: expiration,
          },
        } as any;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
