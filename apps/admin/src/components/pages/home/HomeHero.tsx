import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

import { useHero } from '@/lib/hooks';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const HERO_EMOJI = `${API_BASE}/api/media/emojis/4935-redstone.png`;
const CTA_EMOJI = `${API_BASE}/api/media/emojis/31562-minecraft-bee.gif`;

const FALLBACK_SLIDE = {
  title: '🏰 Welcome to AmzCraft',
  subtitle:
    'Your home for community-driven Minecraft adventures. Seasonal events, ranked perks, and creative builds await!',
  imageUrl:
    'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(59,130,246,0.35) 55%, rgba(236,72,153,0.35) 100%)',
  ctaText: 'Play Now',
  ctaUrl: '/play',
};

export function HomeHero() {
  const { data, isLoading } = useHero();
  const slides = useMemo(() => (data && data.length > 0 ? data : null), [data]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [slides?.length]);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const timer = window.setInterval(
      () => setActive((prev) => (prev + 1) % slides.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [slides]);

  if (isLoading) {
    return (
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-black via-black/80 to-transparent">
        <div className="mx-auto h-[360px] max-w-6xl rounded-[32px] border border-white/10 bg-black/30" />
      </section>
    );
  }

  if (!slides) {
    return (
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-black via-black/80 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16 lg:px-10">
          <div className="relative h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-black/40 shadow-2xl">
            <HeroSlide
              slide={FALLBACK_SLIDE}
              isActive
              emoji={HERO_EMOJI}
              ctaEmoji={CTA_EMOJI}
            />
          </div>
        </div>
      </section>
    );
  }

  const current = slides[active];

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-black via-black/80 to-transparent">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_15%,rgba(16,185,129,0.25),transparent)]" />
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16 lg:px-10">
        <div className="relative h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-black/40 shadow-2xl">
          {slides.map((slide, index) => (
            <HeroSlide
              key={slide.id}
              slide={slide}
              isActive={index === active}
              emoji={HERO_EMOJI}
              ctaEmoji={CTA_EMOJI}
            />
          ))}
          <div className="absolute inset-x-6 bottom-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white/70 md:text-sm">
            <div className="flex items-center gap-2">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/70 transition hover:text-white"
                aria-label="Previous slide"
                onClick={() =>
                  setActive((prev) => (prev - 1 + slides.length) % slides.length)
                }
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/70 transition hover:text-white"
                aria-label="Next slide"
                onClick={() => setActive((prev) => (prev + 1) % slides.length)}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setActive(index)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] transition ${
                    index === active
                      ? 'border-emerald-400 bg-emerald-500/15 text-white'
                      : 'border-white/15 bg-black/40 text-white/50 hover:text-white'
                  }`}
                >
                  {index === active ? <Sparkles className="h-3 w-3" /> : null}
                  {slide.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Hidden background for SSR fallback */}
      {current?.imageUrl ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-20 blur-2xl"
          style={{ backgroundImage: `url(${current.imageUrl})` }}
        />
      ) : null}
    </section>
  );
}

type SlideProps = {
  slide: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
  };
  isActive: boolean;
  emoji: string;
  ctaEmoji: string;
};

function HeroSlide({ slide, isActive, emoji, ctaEmoji }: SlideProps) {
  return (
    <article
      className={`absolute inset-0 grid h-full grid-cols-1 overflow-hidden transition-opacity duration-700 ease-in-out md:grid-cols-[1.1fr,0.9fr] ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!isActive}
    >
      <div
        className="relative flex flex-col justify-center gap-6 bg-cover bg-center p-8 md:p-12"
        style={{
          backgroundImage: slide.imageUrl ? `url(${slide.imageUrl})` : FALLBACK_SLIDE.imageUrl,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/65 to-black/75" />
        <div className="relative space-y-4 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-1 text-xs uppercase tracking-[0.45em] text-emerald-300">
            <img src={emoji} alt="" className="h-4 w-4 rounded-sm object-contain" />
            Featured
          </div>
          <h1 className="font-display text-4xl font-black leading-tight md:text-5xl">
            {slide.title}
          </h1>
          {slide.subtitle ? (
            <p className="max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
              {slide.subtitle}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={slide.ctaUrl ?? FALLBACK_SLIDE.ctaUrl}
              target={slide.ctaUrl?.startsWith('http') ? '_blank' : undefined}
              rel={slide.ctaUrl?.startsWith('http') ? 'noreferrer' : undefined}
              className="group inline-flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black shadow-[0_6px_0_rgba(4,57,46,0.7)] transition hover:translate-y-0.5 hover:shadow-[0_4px_0_rgba(4,57,46,0.7)]"
            >
              <img src={ctaEmoji} alt="" className="h-5 w-5 rounded-full object-contain" />
              {slide.ctaText ?? FALLBACK_SLIDE.ctaText}
            </a>
          </div>
        </div>
      </div>
      <div className="relative hidden md:block">
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>
    </article>
  );
}
