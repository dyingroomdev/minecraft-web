import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarRange, Hourglass, MapPin, Sparkles } from 'lucide-react';

import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/lib/types';

function computeTimeState(event: Event, now: Date) {
  const start = event.start_at ? new Date(event.start_at) : null;
  const end = event.end_at ? new Date(event.end_at) : null;

  if (event.is_active) {
    return { label: 'Live event', tone: 'bg-emerald-500/15 text-emerald-300' };
  }

  if (start && end && now > end) {
    return { label: 'Archived event', tone: 'bg-muted text-muted-foreground' };
  }

  if (start && now < start) {
    return { label: 'Coming soon', tone: 'bg-sky-500/15 text-sky-300' };
  }

  return { label: 'Archived event', tone: 'bg-muted text-muted-foreground' };
}

export function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => apiClient.getEvent(slug),
    enabled: Boolean(slug),
  });

  const status = useMemo(() => {
    if (!data) {
      return { label: 'Event', tone: 'bg-muted text-muted-foreground' };
    }
    return computeTimeState(data, new Date());
  }, [data]);

  return (
    <section className="container mx-auto max-w-4xl px-4 py-12 space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/events" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>
        </Button>
      </div>

      {slug === '' ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-destructive">
          Missing event identifier.
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <div className="h-60 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      ) : error || !data ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-destructive">
          We couldn&apos;t find that event. It may have been archived.
        </div>
      ) : (
        <>
          <article className="space-y-6">
            {data.featured_image_url ? (
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted">
                <img
                  src={data.featured_image_url}
                  alt={data.title}
                  className="h-64 w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-violet-500/20 text-4xl">
                <Sparkles className="mr-2 h-6 w-6 text-emerald-300" />
                Event Spotlight
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Badge className={status.tone}>{status.label}</Badge>
              <span className="text-sm text-muted-foreground">
                Posted on {formatDate(data.created_at)}
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight">{data.title}</h1>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                <p className="whitespace-pre-wrap">{data.description}</p>
              </div>

              <aside className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Event details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <CalendarRange className="mt-0.5 h-4 w-4" />
                      <div>
                        <p className="font-medium text-on">Schedule</p>
                        <p>
                          {data.start_at ? formatDate(data.start_at) : 'TBA'}
                          {data.end_at ? ` – ${formatDate(data.end_at)}` : ''}
                        </p>
                      </div>
                    </div>

                    {data.location ? (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4" />
                        <div>
                          <p className="font-medium text-on">Location</p>
                          <p>{data.location}</p>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-start gap-2">
                      <Hourglass className="mt-0.5 h-4 w-4" />
                      <div>
                        <p className="font-medium text-on">Status</p>
                        <p>{status.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/70">
                  <CardHeader>
                    <CardTitle className="text-lg">Stay prepared</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Add the AmzCraft event calendar to your favourite app so you don&apos;t miss a single quest or tournament.
                    </p>
                    <Button variant="outline" onClick={async () => {
                      const blob = await apiClient.downloadEventsCalendar();
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement('a');
                      anchor.href = url;
                      anchor.download = 'amzcraft-events.ics';
                      document.body.append(anchor);
                      anchor.click();
                      anchor.remove();
                      URL.revokeObjectURL(url);
                    }}>
                      Download full calendar
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </article>
        </>
      )}
    </section>
  );
}
