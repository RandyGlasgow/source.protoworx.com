'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              You&apos;ve successfully completed onboarding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is the explore page. You can now discover and share LLM
              resources.
            </p>
            <div className="mt-6 rounded-lg bg-muted p-4">
              <h3 className="mb-2 font-semibold">Your Profile</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Email: </li>
                <li>Username: </li>
                <li>Email Verified: </li>
                <li>Onboarded: </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
