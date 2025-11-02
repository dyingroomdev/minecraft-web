import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminEvents() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
        <p className="text-muted-foreground">Schedule and curate community events for the server.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Event management UI is under construction. Continue using the REST endpoints to manage events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You will be able to create event timelines, set reminders, and feature events on the home page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
