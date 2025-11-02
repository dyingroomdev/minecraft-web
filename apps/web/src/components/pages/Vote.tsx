import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';

export function Vote() {
  const { data: links, isLoading, error } = useQuery({
    queryKey: ['vote-links'],
    queryFn: () => apiClient.getVoteLinks(),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Support the realm</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Vote for AmzCraft</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Cast your vote on partner sites to help our community grow and earn exclusive in-game rewards.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>

      <div className="mt-10">
        {isLoading ? (
          <p className="text-muted-foreground">Loading vote links…</p>
        ) : error ? (
          <p className="text-destructive">Unable to load vote links.</p>
        ) : (links?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground">Vote links are not available yet. Check back soon!</p>
        ) : (
          <div className="grid gap-6">
            {links?.map((link) => (
              <article
                key={link.id}
                className="rounded-lg border border-border bg-card p-6 shadow-sm transition hover:border-primary/60"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">{link.title}</h2>
                    {link.description ? (
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    ) : null}
                  </div>
                  <Button asChild size="lg">
                    <a href={link.url} target="_blank" rel="noreferrer">
                      {link.button_text || 'Vote'}
                    </a>
                  </Button>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Rewards
                  </h3>
                  {link.rewards.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {link.rewards.map((reward, index) => (
                        <li key={index}>{reward}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No rewards listed.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
