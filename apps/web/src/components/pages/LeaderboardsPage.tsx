import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams, Link } from 'react-router-dom';

import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DEFAULT_TYPES = ['overall', 'kills', 'playtime'];

export function LeaderboardsPage() {
  const { season } = useParams<{ season: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentType = searchParams.get('type') || DEFAULT_TYPES[0];

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', season, currentType],
    queryFn: () => {
      if (!season) throw new Error('Missing season');
      return apiClient.getLeaderboard(season, currentType);
    },
    enabled: Boolean(season),
  });

  const leaderboardTypes = useMemo(() => {
    if (!data?.metadata?.available_types || !Array.isArray(data.metadata.available_types)) {
      return DEFAULT_TYPES;
    }
    return data.metadata.available_types as string[];
  }, [data]);

  useEffect(() => {
    if (!data || leaderboardTypes.length === 0) return;
    if (!leaderboardTypes.includes(currentType)) {
      handleTypeChange(leaderboardTypes[0]);
    }
  }, [data, currentType, leaderboardTypes]);

  const handleTypeChange = (type: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('type', type);
    setSearchParams(next, { replace: true });
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10">Loading leaderboard…</div>;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-destructive mb-4">Unable to load leaderboard data.</p>
        <Button asChild>
          <Link to="/">Return home</Link>
        </Button>
      </div>
    );
  }

  const lastUpdated = (data.updated_at ?? data.created_at ?? (data.metadata?.generated_at as string | undefined)) ?? null;

  return (
    <section className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-lime-500">Season {season}</p>
        <h1 className="text-4xl font-bold tracking-tight">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">
          Showing {currentType} rankings. Last updated {formatDate(lastUpdated)}.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {leaderboardTypes.map((type) => (
          <Button
            key={type}
            variant={type === currentType ? 'default' : 'outline'}
            onClick={() => handleTypeChange(type)}
            size="sm"
          >
            {type.toUpperCase()}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data.title || currentType.toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Player</th>
                  <th className="px-4 py-2">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.entries.map((entry) => (
                  <tr key={`${entry.position}-${entry.player}`} className="hover:bg-muted/60">
                    <td className="px-4 py-2 font-semibold">{entry.position}</td>
                    <td className="px-4 py-2">{entry.player}</td>
                    <td className="px-4 py-2">{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
