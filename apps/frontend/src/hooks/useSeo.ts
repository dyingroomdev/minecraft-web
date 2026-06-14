import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
    queryFn: async (): Promise<SeoSettings> => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/seo', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch SEO settings');
      return response.json();
    }
  });
};

export const useSaveSeo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (body: Partial<SeoSettings>) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/seo', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Failed to save SEO settings');
      return response.json();
    },
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
    mutationFn: async () => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/seo/sitemap/rebuild', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to rebuild sitemap');
      return response.json();
    },
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
    mutationFn: async (file: File) => {
      const token = localStorage.getItem('admin_token');
      const fd = new FormData();
      fd.append('file', file);
      const response = await fetch('http://localhost:8001/admin/seo/og-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: fd
      });
      if (!response.ok) throw new Error('Failed to upload OG image');
      return response.json();
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