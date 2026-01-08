import { PrismaService } from 'src/prisma/prisma.service';

export const cleanupTestData = async (prisma: PrismaService) => {
  await prisma.auth.deleteMany({});
  await prisma.user.deleteMany({});
};

export const createTestUserInDb = async (
  prisma: PrismaService,
  email = 'test@example.com',
  passwordHash = '$2b$10$hashedpassword',
  emailVerified = false,
) => {
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Test User',
      auth: {
        create: {
          passwordHash,
          emailVerified,
        },
      },
    },
    include: {
      auth: true,
    },
  });
  return user;
};
