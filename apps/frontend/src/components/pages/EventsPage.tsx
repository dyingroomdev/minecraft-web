import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, CalendarRange, MapPin, Sparkles } from 'lucide-react';

import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/lib/types';

const HERO_EMOJI = '🎉';
const ARCHIVE_EMOJI = '📜';

function coerceDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getEventKey(event: Event): number {
  return (
    coerceDate(event.start_at)?.getTime() ??
    coerceDate(event.end_at)?.getTime() ??
    coerceDate(event.created_at)?.getTime() ??
    0
  );
}

function isUpcoming(event: Event, now: Date): boolean {
  if (event.is_active) {
    return true;
  }
  const start = coerceDate(event.start_at);
  const end = coerceDate(event.end_at);
  if (start && start >= now) {
    return true;
  }
  if (start && end && now <= end && now >= start) {
    return true;
  }
  return false;
}

function buildExcerpt(description: string, max = 160): string {
  const trimmed = description.trim();
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : slice.length)}…`;
}

export function EventsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => apiClient.getEvents(),
  });

  const now = useMemo(() => new Date(), []);

  const { featuredEvent, otherUpcoming, archiveGroups } = useMemo(() => {
    const events = (data ?? []).slice();
    const upcoming = events
      .filter((event) => isUpcoming(event, now))
      .sort((a, b) => getEventKey(a) - getEventKey(b));

    const [featured, ...restUpcoming] = upcoming;

    const archiveSource = events.filter((event) => !upcoming.includes(event));
    const archiveMap = new Map<
      number,
      { label: string; events: Event[] }
    >();

    archiveSource.forEach((event) => {
      const referenceDate =
        coerceDate(event.end_at) ??
        coerceDate(event.start_at) ??
        coerceDate(event.created_at);
      const year = referenceDate?.getFullYear() ?? new Date().getFullYear();
      if (!archiveMap.has(year)) {
        archiveMap.set(year, {
          label: new Intl.DateTimeFormat('en', { year: 'numeric' }).format(
            new Date(year, 0, 1),
          ),
          events: [],
        });
      }
      archiveMap.get(year)?.events.push(event);
    });

    const archive = Array.from(archiveMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, entry]) => {
        entry.events.sort((aEvent, bEvent) => getEventKey(bEvent) - getEventKey(aEvent));
        return { id: String(year), label: entry.label, events: entry.events };
      });

    return {
      featuredEvent: featured ?? null,
      otherUpcoming: restUpcoming,
      archiveGroups: archive,
    };
  }, [data, now]);

  async function handleDownloadCalendar() {
    const blob = await apiClient.downloadEventsCalendar();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'amzcraft-events.ics';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-lime-500 flex items-center gap-2">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Seasonal happenings
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            {HERO_EMOJI} Events & Activities
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Join limited-time tournaments, quests, and server-wide celebrations. Subscribe to the calendar to stay in sync.
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadCalendar} disabled={isLoading || Boolean(error)}>
          Download ICS
        </Button>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Loading events…</p>
      ) : error ? (
        <p className="text-destructive">Failed to load events. Please try again later.</p>
      ) : !featuredEvent && otherUpcoming.length === 0 && archiveGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-lime-400 p-12 text-center text-muted-foreground">
          No events scheduled at the moment. Check back soon!
        </div>
      ) : (
        <div className="space-y-8">
          {featuredEvent ? (
            <section className="grid gap-6 lg:grid-cols-3 lg:items-start">
              <article className="lg:col-span-2 overflow-hidden rounded-xl border border-border/70 bg-card shadow-lg">
                <div
                  className="h-60 w-full bg-cover bg-center"
                  style={{
                    backgroundImage: featuredEvent.featured_image_url
                      ? `url(${featuredEvent.featured_image_url})`
                      : 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(16,185,129,0.45))',
                  }}
                  aria-hidden="true"
                />
                <div className="space-y-4 p-6">
                  <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-400">
                    <CalendarDays className="h-4 w-4" />
                    Upcoming highlight
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight">{featuredEvent.title}</h2>
                  <p className="text-muted-foreground">{buildExcerpt(featuredEvent.description, 220)}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-4 w-4" />
                      <span>
                        {featuredEvent.start_at ? formatDate(featuredEvent.start_at) : 'TBA'}
                        {featuredEvent.end_at ? ` – ${formatDate(featuredEvent.end_at)}` : ''}
                      </span>
                    </div>
                    {featuredEvent.location ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{featuredEvent.location}</span>
                      </div>
                    ) : null}
                  </div>
                  <Button asChild>
                    <Link to={`/events/${featuredEvent.slug}`} className="flex items-center gap-2">
                      View details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </article>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-300">More adventures coming up</h3>
                {otherUpcoming.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-emerald-500/40 p-4 text-sm text-muted-foreground">
                    No additional events yet—stay tuned!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {otherUpcoming.map((event) => (
                      <Card key={event.id} className="border border-border/60 bg-card/80">
                        <CardHeader>
                          <CardTitle className="text-base">
                            <Link to={`/events/${event.slug}`} className="hover:text-primary">
                              {event.title}
                            </Link>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            {event.start_at ? formatDate(event.start_at) : 'TBA'}
                            {event.end_at ? ` – ${formatDate(event.end_at)}` : ''}
                          </p>
                          <p className="line-clamp-3">{event.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">
                {ARCHIVE_EMOJI} Event archive
              </h2>
              <p className="text-sm text-muted-foreground">
                Relive past celebrations and community highlights.
              </p>
            </header>
            {archiveGroups.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/50 p-6 text-center text-muted-foreground">
                Archive will grow once events wrap up. Keep exploring!
              </p>
            ) : (
              <div className="space-y-6">
                {archiveGroups.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <h3 className="text-lg font-semibold text-muted-foreground">{group.label}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {group.events.map((event) => (
                        <Card key={event.id} className="border border-border/60 bg-card/70 transition hover:border-primary/60">
                          {event.featured_image_url ? (
                            <div className="h-40 w-full overflow-hidden rounded-t-xl bg-muted">
                              <img
                                src={event.featured_image_url}
                                alt={event.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : null}
                          <CardHeader>
                            <CardTitle className="text-lg">
                              <Link to={`/events/${event.slug}`} className="hover:text-primary">
                                {event.title}
                              </Link>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              {event.start_at ? formatDate(event.start_at) : 'TBA'}
                              {event.end_at ? ` – ${formatDate(event.end_at)}` : ''}
                            </p>
                            {event.location ? (
                              <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </p>
                            ) : null}
                            <p className="line-clamp-3">{event.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
