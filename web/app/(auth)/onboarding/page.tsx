'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnboarding } from '@/hooks/use-onboarding';
import { onboardingSchema } from '@/lib/validations/auth';
import { z } from 'zod';

export default function OnboardingPage() {
  const router = useRouter();
  const onboarding = useOnboarding();
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate username
      const validated = onboardingSchema.parse({ username });

      // Call API (hook will update user context)
      await onboarding.mutateAsync(validated.username);

      // Redirect to explore page
      router.push('/explore');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setErrors({ general: error.message });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    // Clear errors
    if (errors.username) {
      setErrors({});
    }
  };

  return (
    <div className="container flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose your username</CardTitle>
          <CardDescription>
            This is how other users will identify you on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {errors.general}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={handleChange}
                disabled={onboarding.isPending}
                autoFocus
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
              <p className="text-xs text-muted-foreground">
                3-30 characters. Letters, numbers, underscores, and hyphens only.
                Will be converted to lowercase.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={onboarding.isPending}>
              {onboarding.isPending ? 'Completing setup...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
