import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
    queryFn: async (): Promise<SocialLinks> => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/social', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch social links');
      return response.json();
    }
  });
};

export const useSaveSocial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (body: Partial<SocialLinks>) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/social', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Failed to save social links');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-admin'] });
      toast.success('Social links updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};