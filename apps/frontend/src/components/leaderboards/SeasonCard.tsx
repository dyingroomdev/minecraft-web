import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LeaderboardIndexItem } from '@/lib/types';
import { emojiForIndex, formatSeasonDates, isSeasonLive } from '@/lib/leaderboards';

interface SeasonCardProps {
  item: LeaderboardIndexItem;
  index: number;
  onTypeClick?: (type: string) => void;
  activeTypes?: Set<string>;
}

export function SeasonCard({ item, index, onTypeClick, activeTypes }: SeasonCardProps) {
  const emoji = emojiForIndex(index);
  const isLive = isSeasonLive(item);

  return (
    <Card className="relative overflow-hidden border border-stone-700 bg-surface shadow-lg transition hover:border-lime-400/60">
      <div className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 opacity-80">
        <img src={emoji} alt="" className="h-full w-full object-contain" loading="lazy" />
      </div>
      <CardHeader className="relative space-y-2">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="uppercase tracking-wide text-xs">
            {item.season.replace(/[-_]/g, ' ')}
          </Badge>
          {isLive ? (
            <Badge className="bg-lime-500/90 text-forest-900 font-semibold uppercase">Live</Badge>
          ) : null}
        </div>
        <CardTitle className="text-2xl">{item.title ?? item.season}</CardTitle>
        <p className="text-sm text-muted-foreground">{formatSeasonDates(item)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(item.types ?? []).map((type) => {
            const isActive = activeTypes?.has(type) ?? false;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onTypeClick?.(type)}
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
        </div>

        <Button asChild className="w-full bg-brand hover:bg-brand/90">
          <Link to={`/leaderboards/${item.season}`}>View season</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
