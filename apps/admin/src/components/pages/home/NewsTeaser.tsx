import { Link } from 'react-router-dom';

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

  const items = [...data]
    .sort((a, b) => {
      const first = a.published_at ? new Date(a.published_at).getTime() : 0;
      const second = b.published_at ? new Date(b.published_at).getTime() : 0;
      return second - first;
    })
    .slice(0, 3);

  return (
    <section id="news" className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-6 flex flex-col gap-3 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">📰 Latest Announcements</h2>
          <p className="text-sm text-white/70">Stay in the loop with patch notes, events, and community spotlights.</p>
        </div>
        <Link
          to="/news"
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-black/50 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-black/70 hover:text-emerald-100"
        >
          View All News
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.slug}
            className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-black/55 p-6 shadow-[0_12px_30px_rgba(12,16,32,0.35)] transition hover:border-emerald-400/40 hover:shadow-[0_16px_40px_rgba(34,197,94,0.3)]"
          >
            <div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/70">{item.summary}</p>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                {item.published_at
                  ? new Date(item.published_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Unscheduled'}
              </span>
              <ButtonLink slug={item.slug} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ButtonLink({ slug }: { slug: string }) {
  return (
    <Link
      to={`/news/${slug}`}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-400 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-black shadow-[0_6px_0_rgba(4,57,46,0.7)] transition hover:translate-y-0.5 hover:shadow-[0_4px_0_rgba(4,57,46,0.7)]"
    >
      Read More
    </Link>
  );
}
