import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { VALID_PASSWORD } from '../src/test-helpers/auth-test-helpers';
import {
  cleanupTestData,
  createTestUserInDb,
} from '../src/test-helpers/prisma-test-helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Clean up any existing test data
    await cleanupTestData(prisma);

    // Set up test user
    testUserEmail = `test-${Date.now()}@example.com`;
    testUserPassword = VALID_PASSWORD;
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
    await app.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData(prisma);
  });

  describe('POST /auth/sign-up', () => {
    it('should create a new user and return success message', () => {
      return request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: testUserEmail,
          password: testUserPassword,
          name: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: 'invalid-email',
          password: testUserPassword,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', false);
        });
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: testUserEmail,
          password: 'weak',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', false);
        });
    });

    it('should reject duplicate email', async () => {
      // Create first user
      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(201);

      // Try to create duplicate
      return request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', false);
        });
    });
  });

  describe('POST /auth/sign-in', () => {
    beforeEach(async () => {
      // Create a verified user for sign-in tests
      const passwordHash = await bcrypt.hash(testUserPassword, 10);
      await createTestUserInDb(
        prisma,
        testUserEmail,
        passwordHash,
        true, // emailVerified
      );
    });

    it('should sign in with valid credentials and return token', () => {
      return request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('token');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user.email).toBe(testUserEmail);
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: testUserEmail,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', false);
        });
    });

    it('should reject unverified email', async () => {
      // Create unverified user
      const unverifiedEmail = `unverified-${Date.now()}@example.com`;
      const passwordHash = await bcrypt.hash(testUserPassword, 10);
      await createTestUserInDb(prisma, unverifiedEmail, passwordHash, false);

      return request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: unverifiedEmail,
          password: testUserPassword,
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', false);
          expect(res.body.message).toContain('verified');
        });
    });
  });

  describe('GET /auth/verify', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create verified user and get token
      const passwordHash = await bcrypt.hash(testUserPassword, 10);
      await createTestUserInDb(prisma, testUserEmail, passwordHash, true);

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      authToken = signInResponse.body.data.token;
    });

    it('should verify valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('valid', true);
        });
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('valid', false);
        });
    });

    it('should handle missing token', () => {
      return request(app.getHttpServer())
        .get('/auth/verify')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('valid', false);
        });
    });
  });

  describe('POST /auth/verify-email', () => {
    let verificationToken: string;

    beforeEach(async () => {
      // Create unverified user with verification token
      const passwordHash = await bcrypt.hash(testUserPassword, 10);
      const user = await createTestUserInDb(
        prisma,
        testUserEmail,
        passwordHash,
        false,
      );

      // Get the verification token from the auth record
      const auth = await prisma.auth.findUnique({
        where: { userId: user.id },
      });
      verificationToken = auth?.emailVerificationToken || '';
    });

    it('should verify email with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: verificationToken })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: 'invalid-token-uuid' })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', false);
        });
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      // Create verified user
      const passwordHash = await bcrypt.hash(testUserPassword, 10);
      await createTestUserInDb(prisma, testUserEmail, passwordHash, true);
    });

    it('should send password reset email', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUserEmail })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should reject non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', false);
        });
    });
  });

  describe('POST /auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Create user with reset token
      const passwordHash = await bcrypt.hash(testUserPassword, 10);
      const user = await createTestUserInDb(
        prisma,
        testUserEmail,
        passwordHash,
        true,
      );

      // Set reset token
      const resetTokenValue = '550e8400-e29b-41d4-a716-446655440000';
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await prisma.auth.update({
        where: { userId: user.id },
        data: {
          passwordResetToken: resetTokenValue,
          passwordResetTokenExpires: expiresAt,
        },
      });

      resetToken = resetTokenValue;
    });

    it('should reset password with valid token', () => {
      const newPassword = 'NewValidPass123!';
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token-uuid',
          newPassword: VALID_PASSWORD,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', false);
        });
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'weak',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', false);
        });
    });
  });

  describe('Complete User Flow', () => {
    it('should complete full registration and sign-in flow', async () => {
      const flowEmail = `flow-${Date.now()}@example.com`;
      const flowPassword = VALID_PASSWORD;

      // 1. Sign up
      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: flowEmail,
          password: flowPassword,
          name: 'Flow Test User',
        })
        .expect(201);

      expect(signUpResponse.body).toHaveProperty('success', true);

      // 2. Get verification token from database
      const user = await prisma.user.findUnique({
        where: { email: flowEmail },
        include: { auth: true },
      });
      expect(user).toBeDefined();
      expect(user?.auth?.emailVerified).toBe(false);

      const verificationToken = user?.auth?.emailVerificationToken;
      expect(verificationToken).toBeDefined();

      // 3. Verify email
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: verificationToken })
        .expect(201);

      expect(verifyResponse.body).toHaveProperty('success', true);

      // 4. Sign in
      const signInResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: flowEmail,
          password: flowPassword,
        })
        .expect(201);

      expect(signInResponse.body).toHaveProperty('success', true);
      expect(signInResponse.body.data).toHaveProperty('token');
      expect(signInResponse.body.data.user.emailVerified).toBe(true);

      // 5. Use token to verify
      const token = signInResponse.body.data.token;
      const verifyTokenResponse = await request(app.getHttpServer())
        .get('/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(verifyTokenResponse.body.data).toHaveProperty('valid', true);
    });
  });
});
