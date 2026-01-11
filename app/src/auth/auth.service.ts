import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResendService } from 'src/resend/resend.service';
import { z } from 'zod';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
  requestPasswordResetSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  validateUserSchema,
  verifyEmailSchema,
  verifyTokenSchema,
  type RequestPasswordResetInput,
  type ResendVerificationInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
  type ValidateUserInput,
  type VerifyEmailInput,
  type VerifyTokenInput,
} from './validators/auth.validator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly resendService: ResendService,
  ) {}

  async signUp(params: SignUpInput) {
    try {
      const validated = signUpSchema.parse(params);

      const existingUser = await this.prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const passwordHash = await this.hashPassword(validated.password);

      const verificationToken = this.generateEmailVerificationToken();
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(
        verificationTokenExpires.getHours() + 48,
      );

      const user = await this.prisma.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          auth: {
            create: {
              passwordHash,
            },
          },
          profile: {
            create: {
              emailVerified: false,
              onboardingComplete: false,
            },
          },
          tokens: {
            create: {
              type: 'VERIFY_EMAIL',
              token: verificationToken,
              expiresAt: verificationTokenExpires,
            },
          },
        },
        include: { auth: true, profile: true },
      });

      // Send verification email
      await this.resendService.sendVerificationEmail(
        user.email,
        verificationToken,
      );

      // Generate JWT token for the new user
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
      };

      const jwtToken = this.jwtService.sign(payload);

      return {
        message: 'Verification email sent',
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.profile?.emailVerified ?? false,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException({
          success: false,
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      throw error;
    }
  }

  async signIn(params: SignInInput) {
    try {
      const validated = signInSchema.parse(params);

      const user = await this.validateUser({
        email: validated.email,
        password: validated.password,
      });

      if (!user) {
        this.logger.warn(
          `Failed sign-in attempt for email: ${validated.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if email is verified
      if (!user.profile?.emailVerified) {
        throw new UnauthorizedException('Email not verified');
      }

      // Generate JWT token
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
      };

      const token = this.jwtService.sign(payload);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.profile?.emailVerified ?? false,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException({
          success: false,
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      throw error;
    }
  }

  verifyToken(params: VerifyTokenInput) {
    try {
      const validated = verifyTokenSchema.parse(params);

      let token = validated.token;
      // Extract token from Bearer format if needed
      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }

      try {
        this.jwtService.verify(token);
        return { valid: true };
      } catch {
        return { valid: false };
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException({
          success: false,
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      throw error;
    }
  }

  async verifyEmail(params: VerifyEmailInput) {
    try {
      const validated = verifyEmailSchema.parse(params);

      const tokenRecord = await this.prisma.temporaryUserToken.findFirst({
        where: {
          token: validated.token,
          type: 'VERIFY_EMAIL',
        },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new BadRequestException('Invalid verification token');
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Verification token has expired');
      }

      // Update user profile and delete token
      await this.prisma.$transaction([
        this.prisma.userProfile.update({
          where: { userId: tokenRecord.userId },
          data: {
            emailVerified: true,
          },
        }),
        this.prisma.temporaryUserToken.delete({
          where: { id: tokenRecord.id },
        }),
      ]);

      this.logger.log(`Email verified for user: ${tokenRecord.user.email}`);

      return { message: 'Email verified' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException({
          success: false,
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      throw error;
    }
  }

  async requestPasswordReset(params: RequestPasswordResetInput) {
    try {
      const validated = requestPasswordResetSchema.parse(params);

      const user = await this.prisma.user.findUnique({
        where: { email: validated.email },
        include: { auth: true },
      });

      if (!user || !user.auth) {
        throw new NotFoundException('User not found');
      }

      // Generate reset token
      const resetToken = this.generatePasswordResetToken();
      const resetTokenExpires = new Date();
      resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

      // Delete any existing password reset tokens for this user
      await this.prisma.temporaryUserToken.deleteMany({
        where: {
          userId: user.id,
          type: 'PASSWORD_RESET',
        },
      });

      // Create new password reset token
      await this.prisma.temporaryUserToken.create({
        data: {
          userId: user.id,
          type: 'PASSWORD_RESET',
          token: resetToken,
          expiresAt: resetTokenExpires,
        },
      });

      // Send password reset email
      await this.resendService.sendPasswordResetEmail(user.email, resetToken);

      this.logger.log(`Password reset requested for user: ${user.email}`);

      return { message: 'Password reset email sent' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException({
          success: false,
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      throw error;
    }
  }

  async resetPassword(params: ResetPasswordInput) {
    try {
      const validated = resetPasswordSchema.parse(params);

      const tokenRecord = await this.prisma.temporaryUserToken.findFirst({
        where: {
          token: validated.token,
          type: 'PASSWORD_RESET',
        },
        include: { user: { include: { auth: true } } },
      });

      if (!tokenRecord || !tokenRecord.user.auth) {
        throw new BadRequestException('Invalid reset token');
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Reset token has expired');
      }

      // Hash new password
      const passwordHash = await this.hashPassword(validated.newPassword);

      // Update auth record and delete token
      await this.prisma.$transaction([
        this.prisma.auth.update({
          where: { id: tokenRecord.user.auth.id },
          data: {
            passwordHash,
          },
        }),
        this.prisma.temporaryUserToken.delete({
          where: { id: tokenRecord.id },
        }),
      ]);

      this.logger.log(
        `Password reset completed for user: ${tokenRecord.user.email}`,
      );

      return { message: 'Password reset successful' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException({
          success: false,
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      throw error;
    }
  }

  async resendVerificationEmail(params: ResendVerificationInput) {
    try {
      const validated = resendVerificationSchema.parse(params);

      const user = await this.prisma.user.findUnique({
        where: { email: validated.email },
        include: { auth: true, profile: true, tokens: true },
      });

      if (!user || !user.auth) {
        throw new NotFoundException('User not found');
      }

      // Find existing valid token
      const existingToken = user.tokens.find(
        (t) =>
          t.type === 'VERIFY_EMAIL' &&
          t.expiresAt > new Date() &&
          !user.profile?.emailVerified,
      );

      let verificationToken: string;
      let verificationTokenExpires: Date;

      if (existingToken) {
        verificationToken = existingToken.token;
        verificationTokenExpires = existingToken.expiresAt;
      } else {
        // Delete expired tokens
        await this.prisma.temporaryUserToken.deleteMany({
          where: {
            userId: user.id,
            type: 'VERIFY_EMAIL',
          },
        });

        // Generate new token
        verificationToken = this.generateEmailVerificationToken();
        verificationTokenExpires = new Date();
        verificationTokenExpires.setHours(
          verificationTokenExpires.getHours() + 48,
        );

        await this.prisma.temporaryUserToken.create({
          data: {
            userId: user.id,
            type: 'VERIFY_EMAIL',
            token: verificationToken,
            expiresAt: verificationTokenExpires,
          },
        });
      }

      // Send verification email
      await this.resendService.sendVerificationEmail(
        user.email,
        verificationToken,
      );

      return { message: 'Verification email sent' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException({
          success: false,
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      throw error;
    }
  }

  async validateUser(params: ValidateUserInput) {
    try {
      const validated = validateUserSchema.parse(params);

      const user = await this.prisma.user.findUnique({
        where: { email: validated.email },
        include: { auth: true, profile: true },
      });

      if (!user || !user.auth) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(
        validated.password,
        user.auth.passwordHash,
      );

      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return null;
      }
      throw error;
    }
  }

  hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('BCRYPT_ROUNDS') || 10;
    return bcrypt.hash(password, rounds);
  }

  generateEmailVerificationToken(): string {
    return randomUUID();
  }

  generatePasswordResetToken(): string {
    return randomUUID();
  }
}
