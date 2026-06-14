import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Filter, Newspaper, Search, Sparkles } from 'lucide-react';

import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { NewsPost } from '@/lib/types';

const API_BASE =
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') ||
  'http://localhost:8001';
const NEWS_BEE = `${API_BASE}/api/media/emojis/31562-minecraft-bee.gif`;

type MonthGroup = {
  id: string;
  label: string;
  sort: number;
  items: NewsPost[];
};

function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

export function NewsList() {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['news'],
    queryFn: () => apiClient.getNews(),
  });
  const [query, setQuery] = useState('');

  const searchFiltered = useMemo(() => {
    if (!query.trim()) {
      return data;
    }
    const needle = query.trim().toLowerCase();
    return data.filter((post) => {
      return (
        post.title.toLowerCase().includes(needle) ||
        (post.summary?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [data, query]);

  const pinnedPosts = useMemo(
    () =>
      searchFiltered
        .filter((post) => post.is_pinned)
        .sort((a, b) => {
          const first = new Date(b.published_at ?? b.scheduled_publish_at ?? '').getTime();
          const second = new Date(a.published_at ?? a.scheduled_publish_at ?? '').getTime();
          return first - second;
        }),
    [searchFiltered],
  );

  const monthGroups = useMemo<MonthGroup[]>(() => {
    const groups = new Map<string, MonthGroup>();
    searchFiltered
      .filter((post) => !post.is_pinned)
      .forEach((post) => {
        const reference = post.published_at ?? post.scheduled_publish_at ?? post.id;
        const date = new Date(reference);
        const isInvalid = Number.isNaN(date.getTime());
        const key = isInvalid
          ? 'unknown'
          : `${date.getFullYear()}-${date.getMonth()}`;
        if (!groups.has(key)) {
          const label = isInvalid
            ? 'Drafts & unscheduled'
            : new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
          groups.set(key, {
            id: key,
            label,
            sort: isInvalid ? -1 : date.getTime(),
            items: [] as NewsPost[],
          });
        }
        groups.get(key)?.items.push(post);
      });

    return Array.from(groups.values())
      .sort((a, b) => b.sort - a.sort)
      .map((group) => ({
        ...group,
        items: group.items.sort((a, b) => {
          const first = new Date(b.published_at ?? b.scheduled_publish_at ?? '').getTime();
          const second = new Date(a.published_at ?? a.scheduled_publish_at ?? '').getTime();
          return first - second;
        }),
      }));
  }, [searchFiltered]);

  return (
    <section className="container mx-auto max-w-5xl px-4 py-12 space-y-10">
      <header className="grid gap-6 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-lg md:grid-cols-[2fr,1fr]">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-400">
            <Newspaper className="h-4 w-4" aria-hidden="true" />
            Newsroom dispatch
          </p>
          <h1 className="text-4xl font-bold tracking-tight">📰 AmzCraft Community News</h1>
          <p className="text-muted-foreground">
            Patch notes, builder spotlights, tournament recaps, and everything buzzing around the realm. Grab a honey bun and catch up!
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Pinned posts stay on top
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-500/10 px-3 py-1 text-slate-200">
              <CalendarDays className="h-4 w-4" />
              Archives grouped by month
            </span>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search posts by title or summary"
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => refetch()}
            >
              <Filter className="h-4 w-4" />
              Refresh feed
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <figure className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/60 p-3">
            <img
              src={NEWS_BEE}
              alt="Happy bee delivering news"
              className="h-28 w-28 rounded-lg object-cover"
            />
            <figcaption className="mt-2 text-center text-xs text-muted-foreground">
              Fresh buzz straight from spawn town!
            </figcaption>
          </figure>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`news-skeleton-${index}`}
              className="h-40 animate-pulse rounded-2xl border border-border/70 bg-card/70"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-destructive">
          We couldn&apos;t fetch the newsroom right now. Please try again later.
        </div>
      ) : searchFiltered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-emerald-500/50 p-10 text-center text-muted-foreground">
          No posts match that search. Try a different keyword or clear the filter.
        </div>
      ) : (
        <div className="space-y-10">
          {pinnedPosts.length > 0 ? (
            <section className="space-y-4">
              <header className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-emerald-300" />
                <h2 className="text-2xl font-semibold tracking-tight text-emerald-200">Pinned highlights</h2>
              </header>
              <div className="space-y-4">
                {pinnedPosts.map((post) => (
                  <NewsCard key={post.id} post={post} featured />
                ))}
              </div>
            </section>
          ) : null}

          {monthGroups.map((group) => (
            <section key={group.id} className="space-y-4">
              <header className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-emerald-300" />
                <h3 className="text-xl font-semibold text-emerald-100">{group.label}</h3>
              </header>
              <div className="space-y-4">
                {group.items.map((post) => (
                  <NewsCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function NewsCard({ post, featured = false }: { post: NewsPost; featured?: boolean }) {
  const imageUrl = resolveMediaUrl(post.cover_image_url ?? null);
  const publishedLabel = post.published_at
    ? formatDate(post.published_at)
    : post.scheduled_publish_at
      ? `Scheduled • ${formatDate(post.scheduled_publish_at)}`
      : 'Draft';

  return (
    <Card
      className={`overflow-hidden border ${featured ? 'border-emerald-400/70 bg-card/80 shadow-lg' : 'border-border/70 bg-card/70'}`}
    >
      <div className="grid gap-0 md:grid-cols-[2fr,3fr]">
        {imageUrl ? (
          <div className="relative h-48 md:h-full">
            <img src={imageUrl} alt={post.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="hidden h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-violet-500/20 md:flex">
            <Newspaper className="h-10 w-10 text-emerald-200" />
          </div>
        )}
        <div className="flex flex-col justify-between">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {post.is_pinned ? (
                <Badge className="bg-emerald-500/15 text-emerald-200">Pinned</Badge>
              ) : null}
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{publishedLabel}</span>
            </div>
            <CardTitle className="text-2xl">
              <Link to={`/news/${post.slug}`} className="hover:text-emerald-300">
                {post.title}
              </Link>
            </CardTitle>
            {post.summary ? <p className="text-sm text-muted-foreground leading-relaxed">{post.summary}</p> : null}
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {featured ? (
              <p>
                Featured stories highlight the biggest happenings—major updates, partnerships, and community events you shouldn&apos;t miss.
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex items-center justify-end border-t border-border/60 bg-card/70 px-6 py-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex items-center gap-2 text-emerald-300 hover:text-emerald-200"
            >
              <Link to={`/news/${post.slug}`}>Read full story →</Link>
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
