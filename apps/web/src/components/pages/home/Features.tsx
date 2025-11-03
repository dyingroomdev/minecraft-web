import { useFeatures } from '@/lib/hooks';

function FeatureSkeleton() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-surface2" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-surface2" />
        ))}
      </div>
    </section>
  );
}

export default function Features() {
  const { data, isLoading } = useFeatures();

  if (isLoading) return <FeatureSkeleton />;
  if (!data?.length) return null;

  const features = [...data].sort((a, b) => a.order - b.order);

  return (
    <section id="features" className="mx-auto max-w-[1200px] px-6 py-12">
      <h2 className="mb-6 font-display text-2xl text-on md:text-3xl">Why Play AmzCraft</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.id}
            className="rounded-2xl border border-accent/30 bg-surface p-5 transition hover:border-brand/40"
          >
            <h3 className="font-semibold text-on">{feature.title}</h3>
            <p className="mt-2 text-sm text-on/75 whitespace-pre-wrap">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
