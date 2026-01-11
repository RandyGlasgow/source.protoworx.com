'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResendVerification } from '@/hooks/use-resend-verification';
import { useUser } from '@/hooks/use-user';
import { useVerifyEmail } from '@/hooks/use-verify-email';
import { CheckCircleIcon, MailIcon, XCircleIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';

const PENDING_VERIFICATION_EMAIL_KEY = 'pending-verification-email';
const emailSchema = z.string().email('Invalid email address');

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();
  const { data: user, isLoading: isUserLoading } = useUser();

  // Check for token in URL
  const token = searchParams.get('token');

  // State for email from sessionStorage or input
  const [emailFromStorage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
    }
    return null;
  });
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Redirect if user is already verified
  useEffect(() => {
    if (!isUserLoading && user && user.emailVerified) {
      if (!user.hasOnboarded) {
        router.push('/onboarding');
      } else {
        router.push('/explore');
      }
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (token) {
      verifyEmail.mutate(token, {
        onSuccess: () => {
          // Auto-login happens in the hook
          // Redirect to onboarding
          setTimeout(() => {
            router.push('/onboarding');
          }, 2000);
        },
      });
    }
  }, [token, verifyEmail, router]);

  const handleResend = async () => {
    setEmailError(null);

    // Determine which email to use
    let emailToUse: string;
    if (emailFromStorage) {
      emailToUse = emailFromStorage;
    } else {
      // Validate email input
      const validationResult = emailSchema.safeParse(emailInput);
      if (!validationResult.success) {
        setEmailError(
          validationResult.error.issues[0]?.message || 'Invalid email address',
        );
        return;
      }
      emailToUse = emailInput;
    }

    try {
      await resendVerification.mutateAsync(emailToUse);
    } catch {
      // Error handled by mutation
    }
  };

  // Verification mode (token in URL)
  if (token) {
    if (verifyEmail.isPending) {
      return (
        <div className="container flex min-h-[85vh] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Verifying your email...</CardTitle>
              <CardDescription>
                Please wait while we verify your email address
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    if (verifyEmail.isSuccess) {
      return (
        <div className="container flex min-h-screen items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle>Email verified!</CardTitle>
              <CardDescription>
                Redirecting you to complete your profile...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    if (verifyEmail.isError) {
      return (
        <div className="container flex min-h-screen items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <XCircleIcon className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Verification failed</CardTitle>
              <CardDescription>
                {verifyEmail.error instanceof Error
                  ? verifyEmail.error.message
                  : 'The verification link may be invalid or expired.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => router.push('/sign-up')}
                className="w-full"
              >
                Back to sign up
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Waiting mode (no token)
  return (
    <div className="container flex min-h-[85vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MailIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link. Please check your email and
            click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or request a
            new one.
          </p>
          {!emailFromStorage && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setEmailError(null);
                }}
                disabled={resendVerification.isPending}
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>
          )}
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full"
            disabled={resendVerification.isPending}
          >
            {resendVerification.isPending
              ? 'Sending...'
              : 'Resend verification email'}
          </Button>
          {resendVerification.isSuccess && (
            <p className="text-center text-sm text-green-600">
              Verification email sent! Please check your inbox.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
