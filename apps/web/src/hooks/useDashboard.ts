import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  server_status: 'online' | 'offline';
  total_payments: number;
  pending_payments: number;
  approved_payments: number;
  rejected_payments: number;
  total_news: number;
  total_events: number;
  total_users: number;
  uptime: string;
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  user?: string;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async (): Promise<RecentActivity[]> => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/dashboard/activity', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
};