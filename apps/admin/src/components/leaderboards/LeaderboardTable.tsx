import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LeaderboardSeasonEntry } from '@/lib/types';

interface LeaderboardTableProps {
  entries: LeaderboardSeasonEntry[];
  columns: string[];
  isLoading?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  highlightPlayer?: string;
}

export function LeaderboardTable({
  entries,
  columns,
  isLoading,
  pageSize = 25,
  emptyMessage = 'No results found.',
  highlightPlayer,
}: LeaderboardTableProps) {
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [entries]);

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return entries.slice(start, start + pageSize);
  }, [entries, page, pageSize]);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages - 1));

  const renderCell = (entry: LeaderboardSeasonEntry, column: string, index: number) => {
    if (column === 'rank') {
      const rank = entry.rank ?? page * pageSize + index + 1;
      return <span className="font-semibold text-lime-400">#{rank}</span>;
    }
    if (column === 'player') {
      const uuid = entry.metadata?.uuid ?? entry.metadata?.mc_uuid;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{entry.player}</span>
          {uuid ? <span className="text-xs font-mono text-muted-foreground">{uuid}</span> : null}
        </div>
      );
    }
    if (column === 'score') {
      return <span className="font-semibold">{entry.score}</span>;
    }
    const value = entry.metadata?.[column];
    if (value === undefined || value === null || value === '') {
      return <span className="text-muted-foreground/60">—</span>;
    }
    if (typeof value === 'object') {
      return <span className="text-xs text-muted-foreground">{JSON.stringify(value)}</span>;
    }
    return <span>{String(value)}</span>;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-stone-700 bg-surface">
      <div className="relative overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface/80 backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="border-b border-stone-700 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {isLoading
              ? Array.from({ length: 5 }).map((_, skeletonIndex) => (
                  <tr key={`skeleton-${skeletonIndex}`} className="animate-pulse">
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-3">
                        <div className="h-4 w-24 rounded bg-muted/40" />
                      </td>
                    ))}
                  </tr>
                ))
              : paginated.map((entry, rowIndex) => {
                  const isHighlight = highlightPlayer
                    ? entry.player.toLowerCase() === highlightPlayer.toLowerCase()
                    : false;
                  return (
                    <tr
                      key={`${entry.player}-${rowIndex}`}
                      className={cn('hover:bg-muted/40', isHighlight && 'bg-lime-500/10')}
                    >
                      {columns.map((column) => (
                        <td key={column} className={cn('px-4 py-3 align-middle', column === 'player' && 'pr-6')}>
                          {renderCell(entry, column, rowIndex)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {!isLoading && entries.length === 0 ? (
        <div className="border-t border-stone-700 px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-stone-700 px-4 py-3 text-xs text-muted-foreground">
        <span>
          Showing {Math.min(entries.length, page * pageSize + 1)}-
          {Math.min(entries.length, (page + 1) * pageSize)} of {entries.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-stone-700"
            onClick={handlePrev}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-stone-700"
            onClick={handleNext}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
