import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminNews() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage News</h1>
          <p className="text-muted-foreground">Draft and publish announcements for the community.</p>
        </div>
        <Button asChild>
          <Link to="/admin/news/new">Create article</Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Editorial workflow</CardTitle>
          <CardDescription>Use the API to create, update, and delete news posts. UI coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            News authoring tools are in progress. Until then, use the REST endpoints or admin CLI to manage articles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
