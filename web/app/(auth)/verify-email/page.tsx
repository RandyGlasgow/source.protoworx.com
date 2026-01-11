'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useResendVerification } from '@/hooks/use-resend-verification';
import { useVerifyEmail } from '@/hooks/use-verify-email';
import { CheckCircleIcon, MailIcon, XCircleIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();

  // Check for token in URL
  const token = searchParams.get('token');

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
    // For resend, we'd need to store the email somewhere
    // For now, show a message to check email again
    try {
      // This is a placeholder - in real app, you'd need to get the email
      // from localStorage or have the user re-enter it
      await resendVerification.mutateAsync('user@example.com');
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Verification mode (token in URL)
  if (token) {
    if (verifyEmail.isPending) {
      return (
        <div className="container flex min-h-screen items-center justify-center px-4 py-12">
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
    <div className="container flex min-h-screen items-center justify-center px-4 py-12">
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
