import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminLeaderboards() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Manage Leaderboards</h1>
        <p className="text-muted-foreground">Configure seasonal leaderboards and reward structures.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Automation underway</CardTitle>
          <CardDescription>Leaderboards configuration UI is under development.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            For now, update leaderboards via the admin APIs or database seeding scripts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
