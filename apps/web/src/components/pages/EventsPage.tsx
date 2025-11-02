import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export function EventsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', 'active'],
    queryFn: () => apiClient.getActiveEvents(),
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10">Loading events…</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-destructive">
        Failed to load events. Please try again later.
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-lime-500">Seasonal happenings</p>
        <h1 className="text-4xl font-bold tracking-tight">Events & Activities</h1>
        <p className="mt-2 text-muted-foreground">
          Join limited-time tournaments, quests, and server-wide celebrations.
        </p>
      </header>

      <div className="space-y-6">
        {data && data.length > 0 ? (
          data.map((event) => (
            <article key={event.id} className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{event.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {event.start_at ? formatDate(event.start_at) : 'TBA'}
                    {event.end_at ? ` – ${formatDate(event.end_at)}` : ''}
                  </p>
                </div>
                {event.location ? (
                  <span className="rounded-full border border-lime-400 px-3 py-1 text-xs uppercase text-lime-400">
                    {event.location}
                  </span>
                ) : null}
              </header>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-lime-400 p-8 text-center text-muted-foreground">
            No active events right now. Check back soon!
          </div>
        )}
      </div>
    </section>
  );
}
