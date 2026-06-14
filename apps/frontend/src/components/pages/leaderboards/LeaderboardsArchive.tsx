import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/leaderboards/SearchInput';
import { SeasonCard } from '@/components/leaderboards/SeasonCard';
import { useLbIndex } from '@/hooks/usePublicLeaderboards';

const SORT_OPTIONS: Array<{ value: 'newest' | 'oldest'; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

export function LeaderboardsArchive() {
  const { data, isLoading, isError, refetch } = useLbIndex();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const allTypes = useMemo(() => {
    const typeSet = new Set<string>();
    (data ?? []).forEach((item) => item.types?.forEach((type) => typeSet.add(type)));
    return Array.from(typeSet.values()).sort();
  }, [data]);

  const filteredSeasons = useMemo(() => {
    const term = search.trim().toLowerCase();
    let seasons = (data ?? []).filter((item) => {
      if (!term) return true;
      const source = `${item.title ?? ''} ${item.season}`.toLowerCase();
      return source.includes(term);
    });

    if (selectedTypes.size > 0) {
      seasons = seasons.filter((item) => {
        const types = item.types ?? [];
        return types.some((type) => selectedTypes.has(type));
      });
    }

    seasons.sort((a, b) => {
      const aTime = new Date(a.end ?? a.start ?? 0).getTime();
      const bTime = new Date(b.end ?? b.start ?? 0).getTime();
      return sort === 'newest' ? bTime - aTime : aTime - bTime;
    });

    return seasons;
  }, [data, search, selectedTypes, sort]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <section className="container mx-auto max-w-6xl px-4 py-12 space-y-10">
      <header className="space-y-3 text-center md:text-left">
        <Badge variant="outline" className="uppercase tracking-wide w-fit mx-auto md:mx-0">
          Archives
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-balance">Leaderboards Archive</h1>
        <p className="text-muted-foreground max-w-2xl text-balance mx-auto md:mx-0">
          Journey through every AmzCraft season. Filter by game mode, track historic champions, and relive the
          stats that shaped our realm.
        </p>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search seasons…"
          className="w-full md:w-72"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {SORT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={option.value === sort ? 'default' : 'outline'}
                className={option.value === sort ? 'bg-lime-500 text-forest-900 hover:bg-lime-400' : 'border-stone-700'}
                onClick={() => setSort(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {allTypes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allTypes.map((type) => {
            const isActive = selectedTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition ${
                  isActive
                    ? 'border-lime-400 bg-lime-500 text-forest-900 shadow'
                    : 'border-stone-700 bg-coal-900/40 text-muted-foreground hover:border-lime-400/40'
                }`}
              >
                {type}
              </button>
            );
          })}
          {selectedTypes.size > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedTypes(new Set())}
              className="text-xs uppercase tracking-wide text-lime-400 hover:text-lime-300"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {isError ? (
        <Card className="border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-destructive">
          <p className="font-semibold">Unable to load leaderboard archive.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="h-52 animate-pulse border border-stone-800 bg-muted/30" />
            ))
          : filteredSeasons.map((item, index) => (
              <SeasonCard
                key={item.season}
                item={item}
                index={index}
                onTypeClick={(type) => toggleType(type)}
                activeTypes={selectedTypes}
              />
            ))}
      </div>

      {!isLoading && filteredSeasons.length === 0 ? (
        <Card className="border border-stone-700 bg-surface p-8 text-center text-sm text-muted-foreground">
          No seasons matched your filters. Try adjusting the search or type filters.
        </Card>
      ) : null}
    </section>
  );
}
