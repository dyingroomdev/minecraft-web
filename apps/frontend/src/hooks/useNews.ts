import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  content: string;
  published_at?: string;
  scheduled_publish_at?: string;
  cover_image_url?: string;
  is_pinned: boolean;
  is_draft: boolean;
}

export const useNews = () => {
  return useQuery({
    queryKey: ['admin-news'],
    queryFn: async (): Promise<NewsPost[]> => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/news', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    }
  });
};

export const useCreateNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<NewsPost, 'id'>) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/news', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create news');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('News post created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useUpdateNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<NewsPost> & { id: string }) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/news/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update news');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('News post updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useDeleteNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete news');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('News post deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};