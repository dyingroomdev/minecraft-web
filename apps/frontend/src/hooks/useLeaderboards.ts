import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface LeaderboardEntry {
  player: string;
  score: number;
  position: number;
  metadata: Record<string, any>;
}

export interface Leaderboard {
  id: string;
  season: string;
  leaderboard_type: string;
  title?: string;
  entries: LeaderboardEntry[];
  metadata: Record<string, any>;
}

export const useUploadLeaderboard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ season, type, title, file }: { 
      season: string; 
      type: string; 
      title?: string;
      file: File;
    }) => {
      const token = localStorage.getItem('admin_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('season', season);
      formData.append('leaderboard_type', type);
      if (title) formData.append('title', title);
      
      const response = await fetch('http://localhost:8001/admin/leaderboards/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload leaderboard');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboards'] });
      toast.success('Leaderboard uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};