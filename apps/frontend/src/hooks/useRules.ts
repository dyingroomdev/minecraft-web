import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Rule {
  id: string;
  title: string;
  content: string;
  category?: string;
  display_order: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export const useRules = () => {
  return useQuery({
    queryKey: ['admin-rules'],
    queryFn: async (): Promise<Rule[]> => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/rules', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch rules');
      return response.json();
    }
  });
};

export const useCreateRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Rule, 'id' | 'created_at' | 'updated_at'>) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/rules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create rule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
      toast.success('Rule created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useUpdateRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Rule> & { id: string }) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/rules/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update rule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
      toast.success('Rule updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useDeleteRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/rules/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete rule');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
      toast.success('Rule deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useReorderRules = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (order: string[]) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/rules/reorder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order })
      });
      if (!response.ok) throw new Error('Failed to reorder rules');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
      toast.success('Rules reordered');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};