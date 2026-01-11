import { Fetch } from '@/api/api-client';
import { useMutation } from '@tanstack/react-query';
export function useOnboarding() {
  return useMutation({
    mutationFn: (username: string) =>
      Fetch.post('/auth/onboarding', { username }),
  });
}
