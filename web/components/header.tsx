'use client';

import { Button } from '@/components/ui/button';
import { LogInIcon, LogOutIcon } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleAuthClick = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 mx-auto w-full">
        <h1 className="text-xl font-semibold">Source</h1>
        <Button
          variant={isLoggedIn ? 'outline' : 'default'}
          onClick={handleAuthClick}
        >
          {isLoggedIn ? (
            <>
              <LogOutIcon data-icon="inline-start" />
              Logout
            </>
          ) : (
            <>
              <LogInIcon data-icon="inline-start" />
              Login
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
