import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export function AdminDashboard() {
  const { data: status } = useQuery({ queryKey: ['server-status'], queryFn: () => apiClient.getServerStatus() });
  const { data: news } = useQuery({ queryKey: ['news'], queryFn: () => apiClient.getNews() });
  const { data: pendingPayments } = useQuery({
    queryKey: ['payments', 'pending'],
    queryFn: () => apiClient.getPayments('pending'),
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Quick overview of live server metrics and outstanding actions.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            {status ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">State:</span> {status.status.toUpperCase()}
                </p>
                <p>
                  <span className="font-semibold">Players:</span> {status.players_online}/{status.players_max}
                </p>
                <p>
                  <span className="font-semibold">Version:</span> {status.metadata?.version ?? 'Unknown'}
                </p>
                <p className="text-muted-foreground text-xs">
                  Updated {formatDate(status.recorded_at)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Status unavailable.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>News Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{news?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">Published articles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingPayments?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">Awaiting manual review</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
