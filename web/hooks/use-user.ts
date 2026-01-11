import { Fetch } from '@/api/api-client';
import { useQuery } from '@tanstack/react-query';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await Fetch.get('/auth/me');
      return response.data;
    },
  });
}
