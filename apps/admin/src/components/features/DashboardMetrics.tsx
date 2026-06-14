import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Activity, Server, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

export function MetricCard({ title, value, change, icon, trend, loading }: MetricCardProps) {
  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
          </div>
          <div className="h-8 w-8 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <Badge 
                variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(change)}%
              </Badge>
            )}
          </div>
        </div>
        <div className="h-8 w-8 text-muted-foreground">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState({
    onlinePlayers: { value: 0, change: 0, trend: 'neutral' as const },
    totalUsers: { value: 0, change: 0, trend: 'neutral' as const },
    serverUptime: { value: '0%', change: 0, trend: 'neutral' as const },
    revenue: { value: '$0', change: 0, trend: 'neutral' as const },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Online Players"
        value={metrics.onlinePlayers.value}
        change={metrics.onlinePlayers.change}
        trend={metrics.onlinePlayers.trend}
        icon={<Users className="h-4 w-4" />}
        loading={loading}
      />
      
      <MetricCard
        title="Total Users"
        value={metrics.totalUsers.value}
        change={metrics.totalUsers.change}
        trend={metrics.totalUsers.trend}
        icon={<Activity className="h-4 w-4" />}
        loading={loading}
      />
      
      <MetricCard
        title="Server Uptime"
        value={metrics.serverUptime.value}
        change={metrics.serverUptime.change}
        trend={metrics.serverUptime.trend}
        icon={<Server className="h-4 w-4" />}
        loading={loading}
      />
      
      <MetricCard
        title="Monthly Revenue"
        value={metrics.revenue.value}
        change={metrics.revenue.change}
        trend={metrics.revenue.trend}
        icon={<DollarSign className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
}