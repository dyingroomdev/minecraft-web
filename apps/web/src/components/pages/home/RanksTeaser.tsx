import { useRanks } from '@/lib/hooks';

function RanksSkeleton() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-surface2" />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-2xl bg-surface2" />
        ))}
      </div>
    </section>
  );
}

export default function RanksTeaser() {
  const { data, isLoading } = useRanks();

  if (isLoading) return <RanksSkeleton />;
  if (!data?.length) return null;

  const showcase = data.slice(0, 3);

  return (
    <section id="ranks" className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl text-on md:text-3xl">Ranks &amp; Perks</h2>
        <a href="/ranks" className="text-sm font-semibold text-brand hover:text-brand2">
          View all →
        </a>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {showcase.map((rank) => (
          <div key={rank.code} className="rounded-2xl border border-accent/30 bg-surface p-6">
            <div className="text-lg font-semibold text-on">{rank.name}</div>
            {rank.description ? <p className="mt-2 text-sm text-on/75">{rank.description}</p> : null}
            <div className="mt-4 text-brand font-semibold">
              {typeof rank.price_bdt === 'number' ? `৳${rank.price_bdt}` : 'See details'}
            </div>
            <a
              href={`/ranks/buy/${rank.code}`}
              className="mt-5 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
            >
              Buy with bKash
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
