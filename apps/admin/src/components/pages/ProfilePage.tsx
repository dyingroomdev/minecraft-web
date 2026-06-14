import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => {
      if (!username) throw new Error('Missing username');
      return apiClient.getPlayer(username);
    },
    enabled: Boolean(username),
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10">Loading player profile…</div>;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="mb-4 text-destructive">Player not found.</p>
        <Link to="/ranks" className="text-sm font-medium text-lime-500 hover:text-lime-400">
          Browse ranks →
        </Link>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-wide text-lime-500">Player profile</p>
        <h1 className="text-4xl font-bold tracking-tight">{data.username}</h1>
        <p className="text-muted-foreground">UUID: {data.minecraft_uuid}</p>
      </header>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>Rank</CardTitle>
          {data.rank ? (
            <Badge variant="secondary" className="text-base">
              {data.rank.display_name}
            </Badge>
          ) : (
            <Badge variant="outline">No premium rank</Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {data.guild ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Guild</p>
                <p className="text-lg font-semibold">{data.guild.name} [{data.guild.tag}]</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not currently in a guild.</p>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Statistics</p>
              <pre className="mt-2 rounded bg-muted p-4 text-xs text-muted-foreground overflow-x-auto">
                {JSON.stringify(data.stats ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
