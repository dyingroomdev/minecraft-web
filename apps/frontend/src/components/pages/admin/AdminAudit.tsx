import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminAudit() {
  const [preview, setPreview] = useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: (limit: number | undefined) => apiClient.exportAuditLogs(limit),
    onSuccess: async (blob, limit) => {
      const text = await blob.text();
      setPreview(text.slice(0, 2000));

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const suffix = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `audit_logs_${suffix}${limit ? `_limit${limit}` : ''}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    },
  });

  const triggerExport = (limit?: number) => exportMutation.mutate(limit);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Export and review administrative actions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => triggerExport(500)} disabled={exportMutation.isPending} variant="outline">
            {exportMutation.isPending ? 'Exporting…' : 'Export (500 Rows)'}
          </Button>
          <Button onClick={() => triggerExport(undefined)} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? 'Exporting…' : 'Export (Default)'}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Recent export preview</CardTitle>
          <CardDescription>
            The CSV downloads automatically. A snippet of the most recent export is shown below to confirm contents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exportMutation.isPending ? (
            <p className="text-sm text-muted-foreground">Generating export…</p>
          ) : exportMutation.isError ? (
            <p className="text-sm text-destructive">Failed to export audit logs.</p>
          ) : preview ? (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted p-4 text-xs text-muted-foreground">
              {preview}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              Use the buttons above to export CSV logs. The first two thousand characters will appear here for quick inspection.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
