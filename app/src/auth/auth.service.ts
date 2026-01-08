import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResendService } from 'src/resend/resend.service';
import { z } from 'zod';
import {
  signUpSchema,
  signInSchema,
  verifyTokenSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  validateUserSchema,
  type SignUpInput,
  type SignInInput,
  type VerifyTokenInput,
  type VerifyEmailInput,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
  type ResendVerificationInput,
  type ValidateUserInput,
} from './validators/auth.validator';
import { JwtPayload } from './interfaces/jwt-payload.interface';

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

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(validated.password);

      // Generate verification token
      const verificationToken = this.generateEmailVerificationToken();
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(
        verificationTokenExpires.getHours() + 48,
      );

      // Create user and auth record
      const user = await this.prisma.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          auth: {
            create: {
              passwordHash,
              emailVerificationToken: verificationToken,
              emailVerificationTokenExpires: verificationTokenExpires,
            },
          },
        },
        include: { auth: true },
      });

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
      if (!user.auth?.emailVerified) {
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
          emailVerified: user.auth.emailVerified,
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

      const auth = await this.prisma.auth.findFirst({
        where: {
          emailVerificationToken: validated.token,
        },
        include: { user: true },
      });

      if (!auth) {
        throw new BadRequestException('Invalid verification token');
      }

      if (
        auth.emailVerificationTokenExpires &&
        auth.emailVerificationTokenExpires < new Date()
      ) {
        throw new BadRequestException('Verification token has expired');
      }

      // Update auth record
      await this.prisma.auth.update({
        where: { id: auth.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpires: null,
        },
      });

      this.logger.log(`Email verified for user: ${auth.user.email}`);

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

      // Check rate limiting
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      if (
        user.auth.passwordResetLastRequestAt &&
        user.auth.passwordResetLastRequestAt > oneHourAgo &&
        user.auth.passwordResetRequestCount >= 3
      ) {
        throw new BadRequestException(
          'Too many password reset requests. Please try again later.',
        );
      }

      // Generate reset token
      const resetToken = this.generatePasswordResetToken();
      const resetTokenExpires = new Date();
      resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

      // Update auth record
      await this.prisma.auth.update({
        where: { id: user.auth.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetTokenExpires: resetTokenExpires,
          passwordResetRequestCount:
            user.auth.passwordResetLastRequestAt &&
            user.auth.passwordResetLastRequestAt > oneHourAgo
              ? user.auth.passwordResetRequestCount + 1
              : 1,
          passwordResetLastRequestAt: now,
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

      const auth = await this.prisma.auth.findFirst({
        where: {
          passwordResetToken: validated.token,
        },
        include: { user: true },
      });

      if (!auth) {
        throw new BadRequestException('Invalid reset token');
      }

      if (
        auth.passwordResetTokenExpires &&
        auth.passwordResetTokenExpires < new Date()
      ) {
        throw new BadRequestException('Reset token has expired');
      }

      // Hash new password
      const passwordHash = await this.hashPassword(validated.newPassword);

      // Update auth record
      await this.prisma.auth.update({
        where: { id: auth.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetTokenExpires: null,
          passwordResetRequestCount: 0,
          passwordResetLastRequestAt: null,
        },
      });

      this.logger.log(`Password reset completed for user: ${auth.user.email}`);

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
        include: { auth: true },
      });

      if (!user || !user.auth) {
        throw new NotFoundException('User not found');
      }

      // Generate new token if expired or doesn't exist
      let verificationToken = user.auth.emailVerificationToken;
      let verificationTokenExpires = user.auth.emailVerificationTokenExpires;

      if (
        !verificationToken ||
        !verificationTokenExpires ||
        verificationTokenExpires < new Date()
      ) {
        verificationToken = this.generateEmailVerificationToken();
        verificationTokenExpires = new Date();
        verificationTokenExpires.setHours(
          verificationTokenExpires.getHours() + 48,
        );

        await this.prisma.auth.update({
          where: { id: user.auth.id },
          data: {
            emailVerificationToken: verificationToken,
            emailVerificationTokenExpires: verificationTokenExpires,
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
        include: { auth: true },
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
