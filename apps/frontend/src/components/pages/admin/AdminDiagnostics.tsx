import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { DiagnosticsReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function statusVariant(status: string) {
  switch (status) {
    case 'healthy':
      return 'secondary' as const;
    case 'skipped':
      return 'outline' as const;
    default:
      return 'destructive' as const;
  }
}

function formatResponseTime(value?: number | null) {
  if (typeof value !== 'number') return '∅';
  return `${value.toFixed(2)} ms`;
}

export function AdminDiagnostics() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-diagnostics'],
    queryFn: () => apiClient.getDiagnostics(),
    refetchInterval: 60_000,
  });

  const cards: { key: keyof DiagnosticsReport; title: string; description: string }[] = useMemo(
    () => [
      { key: 'database', title: 'Database', description: 'Primary PostgreSQL instance health.' },
      { key: 'redis', title: 'Redis', description: 'Queue and cache connectivity.' },
      { key: 'rcon', title: 'RCON', description: 'Minecraft command channel availability.' },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diagnostics</h1>
          <p className="text-muted-foreground">
            Monitor backing services and command channels. Data refreshes every minute or on demand.
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} variant="outline">
          {isFetching ? 'Refreshing…' : 'Run Diagnostics'}
        </Button>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Running initial diagnostics…</p>
      ) : error ? (
        <p className="text-destructive">Failed to load diagnostics.</p>
      ) : data ? (
        <>
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant(data.overall_status)} className="uppercase tracking-wide">
              Overall: {data.overall_status.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Last run: {new Date(data.timestamp * 1000).toLocaleString()}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {cards.map(({ key, title, description }) => {
              const detail = data[key];
              return (
                <Card key={key} className="border border-border/70">
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center justify-between">
                      <span>{title}</span>
                      <Badge variant={statusVariant(detail.status)}>{detail.status.toUpperCase()}</Badge>
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>Response time: {formatResponseTime(detail.response_time_ms)}</p>
                    {detail.error ? <p className="text-destructive">{detail.error}</p> : null}
                    {detail.version ? <p>Version: {detail.version}</p> : null}
                    {detail.mode ? <p>Mode: {detail.mode}</p> : null}
                    {detail.top_tables && detail.top_tables.length ? (
                      <div>
                        <p className="font-medium text-foreground">Top tables</p>
                        <ul className="mt-2 space-y-1 text-xs">
                          {detail.top_tables.map((entry) => (
                            <li key={`${entry.schema}.${entry.table}`}>
                              {entry.schema}.{entry.table} — {entry.operations} ops
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
