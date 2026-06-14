import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Loader2, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

export function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['news', slug],
    queryFn: () => {
      if (!slug) {
        throw new Error('Missing slug');
      }
      return apiClient.getNewsPost(slug);
    },
    enabled: Boolean(slug),
  });

  const coverImage = resolveMediaUrl(data?.cover_image_url);
  const publishedLabel = useMemo(() => {
    if (!data) return null;
    if (data.published_at) return formatDate(data.published_at);
    if (data.scheduled_publish_at) return `Scheduled · ${formatDate(data.scheduled_publish_at)}`;
    return 'Draft';
  }, [data]);

  const handleShare = useCallback(async () => {
    if (!data) return;
    const shareUrl = window.location.href;
    const sharePayload = {
      title: data.title,
      text: data.summary ?? data.title,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
      } catch {
        // ignored
      }
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } else {
      toast.info('Copy the link from your browser address bar to share.');
    }
  }, [data]);

  if (isLoading) {
    return (
      <section className="container mx-auto max-w-4xl px-4 py-12 space-y-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading article…
        </div>
        <div className="h-72 animate-pulse rounded-3xl border border-border/70 bg-card/70" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`news-line-${index}`} className="h-4 animate-pulse rounded bg-card/60" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="container mx-auto max-w-4xl px-4 py-12 space-y-6 text-center">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-8 text-destructive">
          We couldn&apos;t load this news post. It may have been archived or the slug is incorrect.
        </div>
        <Button variant="outline" asChild>
          <Link to="/news">← Return to news archive</Link>
        </Button>
      </section>
    );
  }

  return (
    <article className="container mx-auto max-w-4xl px-4 py-12 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="flex items-center gap-2">
          <Link to="/news">
            <ArrowLeft className="h-4 w-4" />
            Back to news
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {data.is_pinned ? (
            <Badge className="bg-emerald-500/15 text-emerald-200">
              <Sparkles className="mr-1 h-3 w-3" />
              Pinned announcement
            </Badge>
          ) : null}
          <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <header className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-xl">
        {coverImage ? (
          <div className="absolute inset-0">
            <img src={coverImage} alt={data.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-violet-500/20" />
        )}
        <div className="relative z-10 flex flex-col gap-4 p-8 md:p-12">
          <span className="text-sm uppercase tracking-wide text-emerald-300">
            {publishedLabel ?? 'Announcement'}
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-on md:text-5xl">{data.title}</h1>
          {data.summary ? <p className="max-w-2xl text-base text-muted-foreground">{data.summary}</p> : null}
        </div>
      </header>

      <section
        className="prose max-w-none rounded-2xl border border-border/70 bg-card/80 p-8 text-on dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: data.content ?? '<p>No content available yet.</p>' }}
      />

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          <span>
            Published {publishedLabel ?? 'soon'} •{' '}
            <Link to="/news" className="text-emerald-300 hover:text-emerald-200">
              explore more posts
            </Link>
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleShare} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share this story
        </Button>
      </footer>
    </article>
  );
}
