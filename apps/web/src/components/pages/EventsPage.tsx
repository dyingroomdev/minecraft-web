import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/lib/types';

interface EventGroup {
  id: string;
  label: string;
  events: Event[];
}

function eventDateKey(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { key: `${date.getFullYear()}-${date.getMonth()}`, label: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date), sort: date.getTime() };
}

export function EventsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => apiClient.getEvents(),
  });

  const groups = useMemo(() => {
    const events = data ?? [];
    const grouped = new Map<string, { label: string; sort: number; items: typeof events }>();

    events.forEach((event) => {
      const keyData = eventDateKey(event.start_at ?? event.end_at ?? event.created_at ?? null);
      const fallbackLabel = 'Unscheduled';
      const groupKey = keyData?.key ?? 'unscheduled';
      const label = keyData?.label ?? fallbackLabel;
      const sort = keyData?.sort ?? Number.MAX_SAFE_INTEGER;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, { label, sort, items: [] });
      }
      grouped.get(groupKey)?.items.push(event);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[1].sort - b[1].sort)
      .map<EventGroup>(([key, value]) => ({ id: key, label: value.label, events: value.items.sort((a, b) => {
        const first = new Date(a.start_at ?? a.end_at ?? a.created_at ?? 0).getTime();
        const second = new Date(b.start_at ?? b.end_at ?? b.created_at ?? 0).getTime();
        return first - second;
      }) }));
  }, [data]);

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
          <p className="text-sm uppercase tracking-wide text-lime-500">Seasonal happenings</p>
          <h1 className="text-4xl font-bold tracking-tight">Events & Activities</h1>
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
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-lime-400 p-12 text-center text-muted-foreground">
          No events scheduled at the moment. Check back soon!
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.id} className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">{group.label}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {group.events.map((event) => (
                  <Card key={event.id} className="border border-border/70">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2 text-lg">
                        <span>{event.title}</span>
                        {event.location ? (
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {event.location}
                          </span>
                        ) : null}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        {event.start_at ? formatDate(event.start_at) : 'TBA'}
                        {event.end_at ? ` – ${formatDate(event.end_at)}` : ''}
                      </p>
                      <p className="whitespace-pre-wrap">{event.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
