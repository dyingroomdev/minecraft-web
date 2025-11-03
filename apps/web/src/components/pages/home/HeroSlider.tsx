import { useEffect, useState } from 'react';

import { useHero } from '@/lib/hooks';
import type { HomepageHeroSlide } from '@/lib/types';

function SlideSkeleton() {
  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-2xl bg-surface2 md:h-[460px]">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface via-surface2 to-surface" />
    </div>
  );
}

function Slider({ slides }: { slides: HomepageHeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[index];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      {slide.imageUrl ? (
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-surface2 to-surface" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/50 to-transparent" />
      <div className="absolute bottom-6 left-6 space-y-3 text-on md:bottom-10 md:left-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight drop-shadow md:text-5xl">
          {slide.title}
        </h1>
        {slide.subtitle ? <p className="max-w-2xl text-on/85 md:text-lg">{slide.subtitle}</p> : null}
        {slide.ctaUrl ? (
          <a
            href={slide.ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-2xl bg-brand px-5 py-3 font-semibold text-bg shadow-card transition hover:opacity-90"
          >
            {slide.ctaText ?? 'Learn more'}
          </a>
        ) : null}
      </div>
      {slides.length > 1 ? (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((entry, i) => (
            <button
              key={entry.id}
              onClick={() => setIndex(i)}
              className={`h-2 w-8 rounded-full transition ${i === index ? 'bg-brand2 shadow-card' : 'bg-on/40'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function HeroSlider() {
  const { data, isLoading } = useHero();

  if (isLoading) {
    return (
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_10%,rgba(70,201,58,.18),transparent_60%)]" />
        <div className="relative mx-auto max-w-[1200px] px-6 py-14 md:py-20">
          <SlideSkeleton />
        </div>
      </section>
    );
  }

  if (!data?.length) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_10%,rgba(70,201,58,.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-[1200px] px-6 py-14 md:py-20">
        <Slider slides={data} />
      </div>
    </section>
  );
}
