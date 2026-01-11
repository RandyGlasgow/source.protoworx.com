import { Fetch } from '@/api/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => Fetch.post('/auth/verify-email', { token }),
    onSuccess: (data) => queryClient.setQueryData(['user'], data.user),
  });
}
