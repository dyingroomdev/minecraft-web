import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminDiagnostics() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Diagnostics</h1>
        <p className="text-muted-foreground">Monitor background jobs, queues, and service health.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Monitoring in progress</CardTitle>
          <CardDescription>Real-time diagnostics dashboards will be embedded here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            For now, use the command-line tooling or Grafana dashboards configured for the deployment.</p>
        </CardContent>
      </Card>
    </div>
  );
}
