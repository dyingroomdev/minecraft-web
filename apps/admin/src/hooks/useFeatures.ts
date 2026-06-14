import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ServerFeature {
  id: string;
  title: string;
  description: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
}

export const useFeatures = () => {
  return useQuery({
    queryKey: ['features-admin'],
    queryFn: async (): Promise<ServerFeature[]> => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/features', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch features');
      return response.json();
    }
  });
};

export const useCreateFeature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<ServerFeature, 'id'>) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/features', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create feature');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features-admin'] });
      toast.success('Feature created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useUpdateFeature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ServerFeature> & { id: string }) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/features/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update feature');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features-admin'] });
      toast.success('Feature updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useDeleteFeature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/features/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete feature');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features-admin'] });
      toast.success('Feature deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};