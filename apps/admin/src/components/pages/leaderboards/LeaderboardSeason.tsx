import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SearchInput } from '@/components/leaderboards/SearchInput';
import { TypeTabs } from '@/components/leaderboards/TypeTabs';
import { LeaderboardTable } from '@/components/leaderboards/LeaderboardTable';
import { ExportCsvButton } from '@/components/leaderboards/ExportCsvButton';
import { CopyLinkButton } from '@/components/leaderboards/CopyLinkButton';
import { useLeaderboard, useLbIndex } from '@/hooks/usePublicLeaderboards';
import { buildShareUrl, deriveColumns, filterEntries, timeAgo, extractQueryParams } from '@/lib/leaderboards';

export function LeaderboardSeason() {
  const { season } = useParams<{ season: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { type: paramType, q: paramQuery } = extractQueryParams(location.search);
  const [search, setSearch] = useState(paramQuery ?? '');
  const [activeType, setActiveType] = useState<string | null>(paramType ?? null);
  const { data: indexData } = useLbIndex();
  const seasonMeta = indexData?.find((item) => item.season === season);

  useEffect(() => {
    setSearch(paramQuery ?? '');
  }, [paramQuery]);

  useEffect(() => {
    if (paramType) {
      setActiveType(paramType);
      return;
    }
    if (!activeType && seasonMeta?.types && seasonMeta.types.length > 0) {
      const fallback = seasonMeta.types[0];
      setActiveType(fallback);
      const params = new URLSearchParams(searchParams);
      params.set('type', fallback);
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [paramType, activeType, seasonMeta, navigate, searchParams]);

  const { data, isLoading, isError, refetch } = useLeaderboard(season, activeType ?? undefined);

  useEffect(() => {
    if (!data) return;
    if (!activeType) return;
    if (!data.available_types.includes(activeType)) {
      const fallback = data.available_types[0] ?? 'score';
      setActiveType(fallback);
      const params = new URLSearchParams(searchParams);
      params.set('type', fallback);
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [data, activeType, searchParams, navigate]);

  const filteredEntries = useMemo(() => filterEntries(data?.entries ?? [], search), [data, search]);
  const columns = useMemo(() => deriveColumns(data?.entries ?? []), [data]);

  const csvRows = useMemo(() => {
    return filteredEntries.map((entry, index) => {
      const row: Record<string, unknown> = {
        rank: entry.rank ?? index + 1,
        player: entry.player,
        score: entry.score,
      };
      Object.entries(entry.metadata ?? {}).forEach(([key, value]) => {
        row[key] = value;
      });
      return row;
    });
  }, [filteredEntries]);

  const highlightPlayerParam = searchParams.get('player');
  const highlightPlayer = highlightPlayerParam?.toLowerCase();

  return (
    <section className="container mx-auto max-w-6xl px-4 py-12 space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Badge variant="outline" className="uppercase tracking-wide w-fit">
            {season}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">Season Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Last updated {timeAgo(data?.updated_at)} • Tracking {data?.entries.length ?? 0} players
          </p>
        </div>
        <Button asChild variant="outline" className="border-stone-700">
          <Link to="/leaderboards">Back to archive</Link>
        </Button>
      </div>

      <Card className="border border-stone-700 bg-surface/60 p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TypeTabs
            types={data?.available_types ?? (activeType ? [activeType] : [])}
            active={activeType ?? ''}
            onChange={(type) => {
              setActiveType(type);
              const params = new URLSearchParams(searchParams);
              params.set('type', type);
              navigate({ search: params.toString() }, { replace: true });
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              placeholder="Search player or stat…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                const params = new URLSearchParams(searchParams);
                if (event.target.value) {
                  params.set('q', event.target.value);
                } else {
                  params.delete('q');
                }
                navigate({ search: params.toString() }, { replace: true });
              }}
              className="w-full sm:w-64"
            />
            <ExportCsvButton
              rows={csvRows}
              columns={columns}
              filename={`${season}-${activeType}.csv`}
              disabled={filteredEntries.length === 0}
            />
            <CopyLinkButton buildUrl={() => buildShareUrl(activeType, search)} />
          </div>
        </div>

        {highlightPlayer ? (
          <p className="text-xs text-muted-foreground">
            Highlighting results for{' '}
            <span className="font-semibold text-lime-400">{highlightPlayerParam}</span>.
          </p>
        ) : null}

        <LeaderboardTable
          entries={filteredEntries}
          columns={columns}
          isLoading={isLoading}
          emptyMessage={search ? 'No players matched your search.' : 'No entries yet.'}
          highlightPlayer={highlightPlayer ?? undefined}
        />
      </Card>

      {isError ? (
        <Card className="border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-destructive">
          <p className="font-semibold">Unable to load leaderboard data.</p>
          <Button className="mt-3" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}
    </section>
  );
}
