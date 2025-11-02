import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function NewsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['news'],
    queryFn: () => apiClient.getNews(),
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10">Loading news…</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-destructive">
        Failed to load news. Please try again later.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-wide text-lime-500">Latest updates</p>
        <h1 className="text-4xl font-bold tracking-tight">Community News</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Stay up to date with Amaze Gaming × AmzCraft announcements, patch notes, and community highlights.
        </p>
      </div>

      <div className="grid gap-6">
        {data?.map((post) => (
          <Card key={post.id} className="border-l-4 border-lime-500">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl">
                  <Link to={`/news/${post.slug}`}>{post.title}</Link>
                </CardTitle>
                {post.summary && (
                  <p className="text-sm text-muted-foreground mt-1">{post.summary}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {post.is_pinned ? <Badge variant="secondary">Pinned</Badge> : null}
                {post.published_at ? (
                  <span className="text-sm text-muted-foreground">{formatDate(post.published_at)}</span>
                ) : (
                  <span className="text-sm text-warning">Unscheduled draft</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Link
                to={`/news/${post.slug}`}
                className="text-sm font-medium text-lime-500 hover:text-lime-400"
              >
                Read more →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
