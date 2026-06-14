import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useRanks } from '@/lib/hooks';
import type { HomepageRankProduct } from '@/lib/types';

function RanksSkeleton() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-6 h-9 w-64 animate-pulse rounded bg-black/30" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-3xl border border-white/10 bg-black/25" />
        ))}
      </div>
    </section>
  );
}

function formatPrice(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'See details';
  return `৳${value.toLocaleString('en-US')}`;
}

function formatDuration(value?: number | null) {
  if (value == null) return 'Lifetime access';
  if (value === 0) return 'Lifetime access';
  if (value === 1) return '1 day';
  return `${value} days`;
}

export default function RanksTeaser() {
  const { data, isLoading } = useRanks();

  const picks: HomepageRankProduct[] = useMemo(() => {
    if (!data?.length) return [];
    return [...data]
      .filter((product) => product.description || product.price_bdt)
      .slice(0, 3);
  }, [data]);

  if (isLoading) return <RanksSkeleton />;
  if (!picks.length) return null;

  if (!picks.length) return null;

  return (
    <section id="ranks" className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">⭐ Unlock Premium Experiences</h2>
          <p className="text-sm text-white/70">
            Upgrade your journey with exclusive perks, cosmetics, and abilities tailored for long-term adventurers.
          </p>
        </div>
        <Link
          to="/ranks"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-black/40 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-black/60 hover:text-emerald-100"
        >
          View all ranks
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {picks.map((rank) => (
          <article
            key={rank.code}
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-black/85 via-black/75 to-black/70 p-6 shadow-[0_14px_35px_rgba(12,45,28,0.45)] transition hover:border-emerald-400/60 hover:shadow-[0_16px_45px_rgba(34,197,94,0.4)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.15),transparent_60%)] opacity-0 transition group-hover:opacity-100" />
            <div className="relative space-y-3 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{rank.name}</h3>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Premium
                </span>
              </div>
              <p className="text-emerald-200 text-lg font-bold">{formatPrice(rank.price_bdt)}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">{formatDuration(rank.duration_days)}</p>
              {rank.description ? (
                <p className="text-sm leading-relaxed text-white/75">{rank.description}</p>
              ) : (
                <p className="text-sm leading-relaxed text-white/60">
                  Unlock exclusive perks, cosmetics, boosters, and permanent bragging rights.
                </p>
              )}
            </div>
            <div className="relative mt-6 flex items-center justify-between">
              <a
                href={`/ranks/buy/${rank.code}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-400 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-black shadow-[0_6px_0_rgba(4,57,46,0.7)] transition hover:translate-y-0.5 hover:shadow-[0_4px_0_rgba(4,57,46,0.7)]"
              >
                Buy with bKash
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
