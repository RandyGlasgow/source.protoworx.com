import { Fetch } from '@/api/api-client';
import { useMutation } from '@tanstack/react-query';

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
  });
}
