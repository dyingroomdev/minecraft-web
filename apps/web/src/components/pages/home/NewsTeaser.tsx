import { useNews } from '@/lib/hooks';

function NewsSkeleton() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-surface2" />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-surface2" />
        ))}
      </div>
    </section>
  );
}

export default function NewsTeaser() {
  const { data, isLoading } = useNews();

  if (isLoading) return <NewsSkeleton />;
  if (!data?.length) return null;

  const items = data.slice(0, 3);

  return (
    <section id="news" className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl text-on md:text-3xl">Latest News</h2>
        <a href="/news" className="text-sm font-semibold text-brand hover:text-brand2">
          View all →
        </a>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.slug}
            href={`/news/${item.slug}`}
            className="rounded-2xl border border-accent/30 bg-surface p-6 transition hover:border-brand/40"
          >
            <div className="text-lg font-semibold text-on">{item.title}</div>
            <p className="mt-2 line-clamp-3 text-sm text-on/70">{item.summary}</p>
            <div className="mt-3 text-xs text-on/50">
              {new Date(item.published_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
