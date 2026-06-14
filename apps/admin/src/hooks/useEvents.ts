import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api';

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  featured_image_url?: string;
  start_at?: string;
  end_at?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
}

export const useEvents = () => {
  return useQuery({
    queryKey: ['admin-events'],
    queryFn: () => apiClient.request<Event[]>('/admin/events'),
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Event, 'id' | 'created_at'>) =>
      apiClient.request<Event>('/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Event> & { id: string }) =>
      apiClient.request<Event>(`/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.request<void>(`/admin/events/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};
