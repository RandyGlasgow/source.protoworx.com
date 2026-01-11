import { Fetch } from '@/api/api-client';
import { useQuery } from '@tanstack/react-query';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => (await Fetch.get('/auth/me')).data,

    staleTime: 1000 * 60 * 5,
  });
}
