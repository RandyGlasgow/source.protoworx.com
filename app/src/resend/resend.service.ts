import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { convertToString } from 'src/lib/convert-to-string';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly resend: Resend;
  private readonly defaultFrom: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not found in environment variables. Email sending will fail.',
      );
    }
    this.resend = new Resend(apiKey);
    this.defaultFrom =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'onboarding@resend.dev';
  }

  onModuleInit() {
    this.logger.log('ResendService initialized');
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: SendEmailOptions): Promise<{ id: string } | null> {
    try {
      const response = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html || '',
        replyTo: options.replyTo,
      });

      if (response.error) {
        this.logger.error(
          `Failed to send email to ${convertToString(options.to)}: ${response.error.message}`,
          ResendService.name,
        );
        return null;
      }

      if (response.data?.id) {
        this.logger.log(
          `Email sent successfully to ${convertToString(options.to)} (ID: ${response.data.id})`,
        );
        return { id: response.data.id };
      }

      this.logger.warn(
        `Email send response missing data for ${convertToString(options.to)}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Unexpected error sending email to ${convertToString(options.to)}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        ResendService.name,
      );
      return null;
    }
  }

  /**
   * Send an email verification email
   */
  async sendVerificationEmail(
    to: string,
    verificationToken: string,
    verificationUrl?: string,
  ): Promise<{ id: string } | null> {
    const url =
      verificationUrl ||
      `${this.configService.get<string>('APP_URL') || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    return this.sendEmail({
      to,
      subject: 'Verify your email address',
      html: `
        <h1>Verify your email address</h1>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${url}">${url}</a></p>
        <p>If you did not request this verification, please ignore this email.</p>
      `,
      text: `Please verify your email address by visiting: ${url}`,
    });
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    resetUrl?: string,
  ): Promise<{ id: string } | null> {
    const url =
      resetUrl ||
      `${this.configService.get<string>('APP_URL') || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to,
      subject: 'Reset your password',
      html: `
        <h1>Reset your password</h1>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="${url}">${url}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `,
      text: `Reset your password by visiting: ${url}`,
    });
  }
}
