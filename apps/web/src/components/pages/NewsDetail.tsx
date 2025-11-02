import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';

import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['news', slug],
    queryFn: () => {
      if (!slug) throw new Error('Missing slug');
      return apiClient.getNewsPost(slug);
    },
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10">Loading article…</div>;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-destructive mb-4">Unable to load this news post.</p>
        <Button asChild>
          <Link to="/news">Back to news</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-wide text-lime-500">Official announcement</p>
        <h1 className="text-4xl font-bold tracking-tight mb-2">{data.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{formatDate(data.published_at)}</span>
          {data.is_pinned ? <span className="rounded-full border border-lime-400 px-3 py-1 text-xs uppercase">Pinned</span> : null}
        </div>
      </div>

      {data.cover_image_url ? (
        <img
          src={data.cover_image_url}
          alt="News cover"
          className="mb-8 w-full rounded-lg border object-cover"
        />
      ) : null}

      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: data.content ?? '<p>No content available.</p>' }}
      />

      <div className="mt-12">
        <Button variant="outline" asChild>
          <Link to="/news">← Back to all news</Link>
        </Button>
      </div>
    </article>
  );
}
