import { Fragment } from 'react';

import { useFeatures } from '@/lib/hooks';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const EMOJI_FILES = [
  '433076-minecraft-diamond-sparkle.gif',
  '60321-deepslate-diamond-ore.png',
  '41742-mcgold.png',
  '4935-redstone.png',
  '960733-villagehero.gif',
  '711628-minecraftcamperfire.gif',
];

type IconDescriptor =
  | { kind: 'emoji'; value: string }
  | { kind: 'image'; value: string };

function resolveIcon(index: number, icon?: string | null): IconDescriptor {
  if (icon) {
    const trimmed = icon.trim();
    if (!trimmed) {
      // fall through to defaults
    } else if (trimmed.startsWith('http')) {
      return { kind: 'image', value: trimmed };
    } else if (trimmed.startsWith('/')) {
      return { kind: 'image', value: `${API_BASE}${trimmed}` };
    } else if (/\.(png|jpe?g|gif)$/i.test(trimmed)) {
      return { kind: 'image', value: `${API_BASE}/api/media/emojis/${trimmed}` };
    } else if (/[\p{Extended_Pictographic}]/u.test(trimmed)) {
      return { kind: 'emoji', value: trimmed };
    }
  }

  const file = EMOJI_FILES[index % EMOJI_FILES.length];
  return { kind: 'image', value: `${API_BASE}/api/media/emojis/${file}` };
}

function FeatureSkeleton() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-black/30" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-3xl border border-white/10 bg-black/30" />
        ))}
      </div>
    </section>
  );
}

function renderMarkdown(text: string) {
  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];

  const flushList = () => {
    if (list.length) {
      elements.push(
        <ul className="ml-5 list-disc space-y-1 text-sm text-white/75" key={`list-${elements.length}`}>
          {list}
        </ul>,
      );
      list = [];
    }
  };

  const renderInline = (value: string) => {
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = boldRegex.exec(value)) !== null) {
      if (match.index > lastIndex) {
        parts.push(value.slice(lastIndex, match.index));
      }
      parts.push(
        <strong key={`bold-${parts.length}`} className="text-white">
          {match[1]}
        </strong>,
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < value.length) {
      parts.push(value.slice(lastIndex));
    }
    return parts;
  };

  lines.forEach((line) => {
    if (!line.trim()) {
      flushList();
      return;
    }
    if (line.trim().startsWith('- ')) {
      list.push(
        <li key={`item-${list.length}`}>{renderInline(line.trim().slice(2))}</li>,
      );
    } else {
      flushList();
      elements.push(
        <p className="text-sm leading-relaxed text-white/75" key={`p-${elements.length}`}>
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList();
  return elements;
}

export default function Features() {
  const { data, isLoading } = useFeatures();

  if (isLoading) return <FeatureSkeleton />;
  if (!data?.length) return null;

  const features = [...data]
    .filter((feature) => feature.is_active !== false)
    .sort((a, b) => a.order - b.order);

  if (!features.length) return null;

  return (
    <section id="features" className="mx-auto max-w-[1200px] px-6 py-12">
      <header className="mb-8 space-y-2 text-white">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">💎 Why Play on AmzCraft</h2>
        <p className="max-w-2xl text-sm text-white/70">
          Discover the pillars that keep our community buzzing—from explosive events to guild skirmishes.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const iconDescriptor = resolveIcon(index, feature.icon ?? null);
          return (
            <article
              key={feature.id}
              className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-black/80 via-black/70 to-black/60 p-6 shadow-[0_12px_30px_rgba(15,30,20,0.35)] transition-all hover:border-emerald-400/50 hover:shadow-[0_12px_40px_rgba(34,197,94,0.35)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.15),transparent_65%)] opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/50 bg-black/60 shadow-[0_0_15px_rgba(34,197,94,0.35)]">
                  {iconDescriptor.kind === 'emoji' ? (
                    <span className="text-2xl leading-none">{iconDescriptor.value}</span>
                  ) : (
                    <img src={iconDescriptor.value} alt="" className="h-8 w-8 object-contain" />
                  )}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                </div>
              </div>
              <div className="relative mt-4 space-y-3">
                {renderMarkdown(feature.description).map((element, idx) => (
                  <Fragment key={idx}>{element}</Fragment>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
