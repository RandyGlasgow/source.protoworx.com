import { Fetch } from '@/api/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export function useSignIn() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const response = await Fetch.post('/auth/sign-in', { email, password });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data);
      console.log({ data });
      if (!data.user.emailVerified) {
        router.push('/verify-email');
      } else if (!data.user.hasOnboarded) {
        router.push('/onboarding');
      } else {
        router.push('/explore');
      }
    },
  });
}
