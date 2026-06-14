import { Link } from 'react-router-dom';

import { useVotes } from '@/lib/hooks';
import { Button } from '@/components/ui/button';

export function DailyActionsBanner() {
  const { data, isLoading } = useVotes();

  if (isLoading) {
    return (
      <section className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="h-32 animate-pulse rounded-3xl bg-black/30" />
      </section>
    );
  }

  if (!data?.length) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#1E2F1E] to-[#274F27] p-8 shadow-[0_10px_30px_rgba(20,80,20,0.35)]">
        <div className="flex flex-col gap-4 text-white md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h3 className="text-3xl font-bold tracking-tight md:text-4xl">🗳️ Vote &amp; Earn Rewards</h3>
            <p className="text-sm text-white/80">Support the realm and claim daily rewards.</p>
          </div>
          <Button
            asChild
            size="lg"
            className="w-fit rounded-xl border border-emerald-300 bg-emerald-400 px-6 py-3 text-base font-semibold text-black shadow-[0_6px_0_rgba(4,57,46,0.7)] transition hover:translate-y-0.5 hover:shadow-[0_4px_0_rgba(4,57,46,0.7)]"
          >
            <Link to="/vote">Vote Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
