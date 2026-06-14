import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api';

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  content: string;
  published_at?: string | null;
  scheduled_publish_at?: string | null;
  cover_image_url?: string | null;
  is_pinned: boolean;
  is_draft: boolean;
}

export const useNews = () => {
  return useQuery({
    queryKey: ['admin-news'],
    queryFn: () => apiClient.request<NewsPost[]>('/admin/news'),
  });
};

export const useCreateNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<NewsPost> & Pick<NewsPost, 'title' | 'content' | 'is_pinned' | 'is_draft'>) =>
      apiClient.request<NewsPost>('/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
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
    mutationFn: ({ id, ...data }: Partial<NewsPost> & { id: string }) =>
      apiClient.request<NewsPost>(`/admin/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
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
    mutationFn: (id: string) =>
      apiClient.request<void>(`/admin/news/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('News post deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};
