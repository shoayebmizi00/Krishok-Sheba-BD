import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';

export function usePublicSummary() {
  return useQuery({
    queryKey: ['dashboard', 'public-summary'],
    queryFn: apiClient.dashboard.publicSummary,
    staleTime: 60_000
  });
}
