import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';

export function RulesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rules'],
    queryFn: () => apiClient.getRules(),
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10">Loading rules…</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-destructive">
        Failed to load rules. Please try again later.
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-lime-500">Community charter</p>
        <h1 className="text-4xl font-bold tracking-tight">Server Rules</h1>
        <p className="mt-2 text-muted-foreground">
          Respectful gameplay keeps Amaze Gaming × AmzCraft thriving. Review the rules below before joining the server.
        </p>
      </header>

      <div className="space-y-6">
        {data?.map((rule) => (
          <article key={rule.id} className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <header className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{rule.title}</h2>
                {rule.category ? (
                  <p className="text-sm text-muted-foreground">Category: {rule.category}</p>
                ) : null}
              </div>
              {rule.is_pinned ? (
                <span className="rounded-full border border-lime-400 px-3 py-1 text-xs uppercase text-lime-400">
                  Pinned
                </span>
              ) : null}
            </header>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {rule.content}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
