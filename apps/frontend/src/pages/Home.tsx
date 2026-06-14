import { HomeHero } from '@/components/pages/home/HomeHero';
import { HomeServerStatus } from '@/components/pages/home/HomeServerStatus';
import { DailyActionsBanner } from '@/components/pages/home/DailyActionsBanner';
import Features from '@/components/pages/home/Features';
import RanksTeaser from '@/components/pages/home/RanksTeaser';
import NewsTeaser from '@/components/pages/home/NewsTeaser';

export default function Home() {
  return (
    <main className="bg-bg text-on">
      <HomeHero />
      <HomeServerStatus />
      <DailyActionsBanner />
      <Features />
      <RanksTeaser />
      <section className="mx-auto max-w-[1200px] px-6 pb-12">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-8 shadow-[0_12px_30px_rgba(8,20,40,0.45)]">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.2),transparent_60%)] opacity-60" />
          <header className="flex flex-col gap-4 text-white md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">🏆 Check the Top Players</h2>
              <p className="mt-2 text-sm text-white/75">
                Track your performance across AmzCraft seasons.
              </p>
            </div>
            <a
              href="/leaderboards"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-400 px-5 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-black shadow-[0_6px_0_rgba(4,57,46,0.7)] transition hover:translate-y-0.5 hover:shadow-[0_4px_0_rgba(4,57,46,0.7)]"
            >
              View Leaderboards
            </a>
          </header>
        </div>
      </section>
      <NewsTeaser />
      <section className="mx-auto max-w-4xl px-6 py-16 text-center text-sm text-muted-foreground">
        More sections are on the way. Stay tuned for the refreshed AmzCraft landing experience.
      </section>
    </main>
  );
}
