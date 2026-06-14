import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminIntegrations() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Platform Integrations</h1>
        <p className="text-muted-foreground">Manage Discord, bKash, and Minecraft service credentials.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Integration settings</CardTitle>
          <CardDescription>Use infrastructure secrets to manage API keys and webhooks.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A streamlined UI for integrations will arrive soon. Until then, update `.env` or secret manager entries directly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
