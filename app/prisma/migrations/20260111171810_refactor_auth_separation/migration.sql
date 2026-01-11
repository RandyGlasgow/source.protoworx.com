-- CreateEnum
CREATE TYPE "TemporaryUserTokenType" AS ENUM ('VERIFY_EMAIL', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "temporary_user_token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TemporaryUserTokenType" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporary_user_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- Migrate data: Create UserProfile records for all users with auth records
INSERT INTO "user_profile" ("id", "userId", "emailVerified", "onboardingComplete", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    a."userId",
    COALESCE(a."emailVerified", false),
    false,
    COALESCE(a."createdAt", CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
FROM "auth" a;

-- Migrate data: Create TemporaryUserToken records for email verification tokens
INSERT INTO "temporary_user_token" ("id", "userId", "type", "token", "expiresAt", "createdAt")
SELECT 
    gen_random_uuid()::text,
    a."userId",
    'VERIFY_EMAIL'::"TemporaryUserTokenType",
    a."emailVerificationToken",
    COALESCE(a."emailVerificationTokenExpires", CURRENT_TIMESTAMP + INTERVAL '48 hours'),
    COALESCE(a."createdAt", CURRENT_TIMESTAMP)
FROM "auth" a
WHERE a."emailVerificationToken" IS NOT NULL;

-- Migrate data: Create TemporaryUserToken records for password reset tokens
INSERT INTO "temporary_user_token" ("id", "userId", "type", "token", "expiresAt", "createdAt")
SELECT 
    gen_random_uuid()::text,
    a."userId",
    'PASSWORD_RESET'::"TemporaryUserTokenType",
    a."passwordResetToken",
    COALESCE(a."passwordResetTokenExpires", CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    COALESCE(a."updatedAt", CURRENT_TIMESTAMP)
FROM "auth" a
WHERE a."passwordResetToken" IS NOT NULL;

-- CreateIndex
CREATE INDEX "temporary_user_token_userId_type_idx" ON "temporary_user_token"("userId", "type");

-- CreateIndex
CREATE INDEX "temporary_user_token_token_idx" ON "temporary_user_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_userId_key" ON "user_profile"("userId");

-- AddForeignKey
ALTER TABLE "temporary_user_token" ADD CONSTRAINT "temporary_user_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Drop old columns from auth table
ALTER TABLE "auth" DROP COLUMN "emailVerificationToken",
DROP COLUMN "emailVerificationTokenExpires",
DROP COLUMN "emailVerified",
DROP COLUMN "passwordResetLastRequestAt",
DROP COLUMN "passwordResetRequestCount",
DROP COLUMN "passwordResetToken",
DROP COLUMN "passwordResetTokenExpires";
