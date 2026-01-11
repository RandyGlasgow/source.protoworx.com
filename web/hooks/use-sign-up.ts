import { Fetch } from '@/api/api-client';
import { useMutation } from '@tanstack/react-query';

const PENDING_VERIFICATION_EMAIL_KEY = 'pending-verification-email';

export function useSignUp() {
  return useMutation({
    mutationFn: ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name?: string;
    }) => Fetch.post('/auth/sign-up', { email, password, name }),
    onSuccess: (_data, variables) => {
      // Store email in sessionStorage for the verify-email page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, variables.email);
      }
    },
  });
}
