import { Fetch } from '@/api/api-client';
import { useMutation } from '@tanstack/react-query';

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) =>
      Fetch.post('/auth/resend-verification', { email }),
  });
}
