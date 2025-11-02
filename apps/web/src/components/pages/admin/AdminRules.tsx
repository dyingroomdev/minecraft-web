import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminRules() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Manage Rules</h1>
        <p className="text-muted-foreground">Update community guidelines and keep players informed.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Rule editor pending</CardTitle>
          <CardDescription>Rule management UI is coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the `/admin/rules` API endpoints to manage rules while we build the editor interface.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
