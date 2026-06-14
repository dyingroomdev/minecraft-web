import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api';

export interface SeoSettings {
  default_title: string;
  title_template: string;
  meta_description: string;
  canonical_base_url: string;
  og_image_url: string | null;
  twitter_handle: string | null;
  robots_policy: 'index,follow' | 'noindex,nofollow' | 'index,nofollow' | 'noindex,follow';
  sitemap_enabled: boolean;
  updated_at: string;
}

export const useSeo = () => {
  return useQuery({
    queryKey: ['seo-admin'],
    queryFn: () => apiClient.request<SeoSettings>('/admin/seo'),
  });
};

export const useSaveSeo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (body: Partial<SeoSettings>) =>
      apiClient.request<SeoSettings>('/admin/seo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-admin'] });
      toast.success('SEO settings updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useRebuildSitemap = () => {
  return useMutation({
    mutationFn: () =>
      apiClient.request<{ message: string }>('/admin/seo/sitemap/rebuild', {
        method: 'POST',
      }),
    onSuccess: () => {
      toast.success('Sitemap rebuilt successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useUploadOg = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return apiClient.request<{ message: string }>('/admin/seo/og-image', {
        method: 'POST',
        body: fd,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-admin'] });
      toast.success('OG image uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};
