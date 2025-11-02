import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminAudit() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-preview'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/admin/audit/export`);
      if (!response.ok) throw new Error('Failed to export');
      return response.text();
    },
    enabled: false, // Triggered manually when needed
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Export and review administrative actions.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Audit export</CardTitle>
          <CardDescription>
            Use the "Export" button to download CSV logs from the API console or monitoring tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Generating export…</p>
          ) : error ? (
            <p className="text-sm text-destructive">Failed to export audit logs.</p>
          ) : data ? (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted p-4 text-xs text-muted-foreground">
              {data.slice(0, 500)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click the export button in the backend admin tooling to download a CSV of audit entries.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
