'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';
import AuthenticatedUser from './authenticated-user';
import UnauthenticatedUser from './unauthenticated-user';

export function Header() {
  const { data: user, isLoading } = useUser();

  let component = null;

  if (isLoading) {
    component = <Skeleton className="w-10 h-10" />;
  } else if (user) {
    component = <AuthenticatedUser />;
  } else {
    component = <UnauthenticatedUser />;
  }
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 mx-auto w-full">
        <Link href="/" className="text-xl font-semibold hover:opacity-80">
          Source
        </Link>

        <div className="flex items-center gap-4">{component}</div>
      </div>
    </header>
  );
}
