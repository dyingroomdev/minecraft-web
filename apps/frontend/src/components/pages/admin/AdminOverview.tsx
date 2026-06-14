import { Activity, CreditCard, Users, Server, FileText, Calendar, Loader2, RefreshCw } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { useDashboardStats, useRecentActivity } from '../../../hooks/useDashboard';
import { useNavigate } from 'react-router-dom';

export default function AdminOverview() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: activity, isLoading: activityLoading, refetch: refetchActivity } = useRecentActivity();

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-on">Dashboard Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 bg-surface border-gray-700 animate-pulse">
              <div className="h-4 bg-surface2 rounded mb-2"></div>
              <div className="h-8 bg-surface2 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-on">Dashboard Overview</h1>
        <Card className="p-6 bg-surface border-gray-700 text-center">
          <p className="text-red-400 mb-4">Failed to load dashboard data</p>
          <Button onClick={() => refetchStats()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const widgets = [
    {
      title: 'Server Status',
      value: stats?.server_status === 'online' ? 'Online' : 'Offline',
      icon: Server,
      color: stats?.server_status === 'online' ? 'text-brand' : 'text-red-400'
    },
    {
      title: 'Pending Payments',
      value: stats?.pending_payments.toString() || '0',
      icon: CreditCard,
      color: 'text-yellow-400',
      onClick: () => navigate('/admin/payments')
    },
    {
      title: 'Total News',
      value: stats?.total_news.toString() || '0',
      icon: FileText,
      color: 'text-blue-400',
      onClick: () => navigate('/admin/news')
    },
    {
      title: 'Active Events',
      value: stats?.total_events.toString() || '0',
      icon: Calendar,
      color: 'text-purple-400',
      onClick: () => navigate('/admin/events')
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-on">Dashboard Overview</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-300">
            Uptime: {stats?.uptime || 'Unknown'}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              refetchStats();
              refetchActivity();
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <Card 
              key={widget.title} 
              className={`p-6 bg-surface border-gray-700 transition-colors ${
                widget.onClick ? 'hover:border-brand/30 cursor-pointer' : ''
              }`}
              onClick={widget.onClick}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">{widget.title}</p>
                  <p className={`text-2xl font-bold ${widget.color}`}>
                    {widget.value}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${widget.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-surface border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-on">Recent Activity</h3>
            {activityLoading && <Loader2 className="h-4 w-4 animate-spin text-brand" />}
          </div>
          <div className="space-y-3">
            {activity?.length ? (
              activity.slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-600 last:border-b-0">
                  <span className="text-gray-200">{item.action}</span>
                  <span className="text-sm text-gray-400">{formatTimeAgo(item.timestamp)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-surface border-gray-700">
          <h3 className="text-lg font-semibold text-on mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total</span>
              <span className="text-on font-semibold">{stats?.total_payments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Pending</span>
              <span className="text-yellow-400 font-semibold">{stats?.pending_payments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-400">Approved</span>
              <span className="text-green-400 font-semibold">{stats?.approved_payments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-400">Rejected</span>
              <span className="text-red-400 font-semibold">{stats?.rejected_payments || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-surface border-gray-700">
          <h3 className="text-lg font-semibold text-on mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              className="w-full justify-start bg-brand/20 hover:bg-brand/30 text-brand"
              onClick={() => navigate('/admin/payments')}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Review Pending Payments ({stats?.pending_payments || 0})
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/admin/news')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Create News Post
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/admin/events')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Manage Events
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-surface border-gray-700">
          <h3 className="text-lg font-semibold text-on mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Server Status</span>
              <div className={`flex items-center gap-2 ${stats?.server_status === 'online' ? 'text-brand' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${stats?.server_status === 'online' ? 'bg-brand' : 'bg-red-400'}`}></div>
                <span className="capitalize">{stats?.server_status || 'Unknown'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Users</span>
              <span className="text-on">{stats?.total_users || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Uptime</span>
              <span className="text-on">{stats?.uptime || 'Unknown'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}