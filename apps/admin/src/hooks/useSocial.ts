import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api';

export interface SocialLinks {
  facebook?: string | null;
  twitter?: string | null;
  discord?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  instagram?: string | null;
  website?: string | null;
}

export const useSocial = () => {
  return useQuery({
    queryKey: ['social-admin'],
    queryFn: () => apiClient.request<SocialLinks>('/admin/social'),
  });
};

export const useSaveSocial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (body: Partial<SocialLinks>) =>
      apiClient.request<SocialLinks>('/admin/social', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-admin'] });
      toast.success('Social links updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};
