import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api';
import type { RankProductAdmin, StackMode } from '@/lib/types';

export function useAdminRankProducts() {
  return useQuery<RankProductAdmin[]>({
    queryKey: ['admin-rank-products'],
    queryFn: () => apiClient.getRankProductsAdmin(),
    staleTime: 5 * 60_000,
  });
}

export function useLuckPermsGroups() {
  return useQuery<string[]>({
    queryKey: ['luckperms-groups'],
    queryFn: () => apiClient.getLuckPermsGroups(),
    staleTime: 60_000,
  });
}

export function useUpdateRankProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      lp_group,
      stack_mode,
    }: {
      id: string;
      lp_group: string | null;
      stack_mode: StackMode;
    }) => apiClient.updateRankProductLpMapping(id, { lp_group, stack_mode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rank-products'] });
      toast.success('Rank mapping updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update rank');
    },
  });
}
