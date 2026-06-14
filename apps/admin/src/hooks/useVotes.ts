import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface VoteLink {
  id: string;
  title: string;
  description?: string;
  url: string;
  button_text: string;
  rewards: string[];
  display_order: number;
  is_active: boolean;
}

export const useVotes = () => {
  return useQuery({
    queryKey: ['votes-admin'],
    queryFn: async (): Promise<VoteLink[]> => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE}/admin/votes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch vote links');
      return response.json();
    }
  });
};

export const useCreateVote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<VoteLink, 'id'>) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE}/admin/votes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create vote link');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes-admin'] });
      toast.success('Vote link created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useUpdateVote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<VoteLink> & { id: string }) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE}/admin/votes/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update vote link');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes-admin'] });
      toast.success('Vote link updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useDeleteVote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE}/admin/votes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete vote link');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes-admin'] });
      toast.success('Vote link deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};