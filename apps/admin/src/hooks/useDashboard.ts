import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';

export interface DashboardStats {
  server_status: 'online' | 'offline';
  players_online: number;
  players_max: number;
  server_version: string | null;
  total_payments: number;
  pending_payments: number;
  approved_payments: number;
  rejected_payments: number;
  total_news: number;
  total_events: number;
  upcoming_events: number;
  total_users: number;
  total_revenue: number;
  premium_members: number;
  uptime: string;
  revenue_last_7_days: Array<{ date: string; total: number }>;
  rank_distribution: Array<{ name: string; count: number }>;
}

export interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  user?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.request<DashboardStats>('/admin/dashboard/stats'),
    refetchInterval: 30_000,
  });

export const useRecentActivity = () =>
  useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => apiClient.request<RecentActivity[]>('/admin/dashboard/activity'),
    refetchInterval: 60_000,
  });
