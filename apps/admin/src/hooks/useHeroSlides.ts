import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  display_order: number;
  is_active: boolean;
}

export const useHeroSlides = () => {
  return useQuery({
    queryKey: ['hero-slides-admin'],
    queryFn: async (): Promise<HeroSlide[]> => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/hero-slides', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch hero slides');
      return response.json();
    }
  });
};

export const useCreateHeroSlide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<HeroSlide, 'id'>) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/hero-slides', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create hero slide');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides-admin'] });
      toast.success('Hero slide created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useUpdateHeroSlide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<HeroSlide> & { id: string }) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/hero-slides/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update hero slide');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides-admin'] });
      toast.success('Hero slide updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useDeleteHeroSlide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/hero-slides/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete hero slide');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides-admin'] });
      toast.success('Hero slide deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};