import { Fetch } from '@/api/api-client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return redirect('/sign-in');
  }

  const { data: user } = await Fetch.get('/auth/me', undefined, {
    headers: new Headers({ Authorization: `Bearer ${token}` }),
  });

  console.log({ user });

  if (!user || !user.emailVerified) {
    return redirect('/verify-email');
  }

  if (user.hasOnboarded) {
    return redirect('/explore');
  }

  return <>{children}</>;
}
