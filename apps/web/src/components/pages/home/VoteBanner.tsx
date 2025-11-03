import { useVotes } from '@/lib/hooks';

function VoteSkeleton() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="animate-pulse rounded-2xl bg-surface2 p-6 md:p-8">
        <div className="h-6 w-48 rounded bg-surface" />
        <div className="mt-4 h-10 rounded bg-surface" />
      </div>
    </section>
  );
}

export default function VoteBanner() {
  const { data, isLoading } = useVotes();

  if (isLoading) return <VoteSkeleton />;
  if (!data?.length) return null;

  const links = [...data].sort((a, b) => a.order - b.order);

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="rounded-2xl bg-gradient-to-r from-accent via-surface2 to-surface p-6 shadow-card md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-2xl text-on md:text-3xl">Vote &amp; Earn Rewards</h3>
            <p className="mt-1 text-sm text-on/80">Support the realm and unlock in-game perks every day.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {links.map((vote) => (
              <a
                key={vote.id}
                href={vote.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-brand px-4 py-2 font-semibold text-bg transition hover:opacity-90"
              >
                {vote.cta ?? vote.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
