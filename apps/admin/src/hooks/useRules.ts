import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api';

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
    queryFn: () => apiClient.request<Rule[]>('/admin/rules'),
  });
};

export const useCreateRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Rule, 'id' | 'created_at' | 'updated_at'>) =>
      apiClient.request<Rule>('/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
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
    mutationFn: ({ id, ...data }: Partial<Rule> & { id: string }) =>
      apiClient.request<Rule>(`/admin/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
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
    mutationFn: (id: string) =>
      apiClient.request<void>(`/admin/rules/${id}`, {
        method: 'DELETE',
      }),
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
    mutationFn: (order: string[]) =>
      apiClient.request<void>('/admin/rules/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
      toast.success('Rules reordered');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};
