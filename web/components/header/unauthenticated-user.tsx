import { Button } from '@/components/ui/button';
import { LogInIcon } from 'lucide-react';
import Link from 'next/link';

export default function UnauthenticatedUser() {
  return (
    <Link href="/sign-in">
      <Button>
        <LogInIcon data-icon="inline-start" />
        Login
      </Button>
    </Link>
  );
}
