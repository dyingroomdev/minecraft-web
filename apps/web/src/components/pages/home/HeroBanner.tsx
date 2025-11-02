import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { HeroSlide } from '@/lib/types';

const SLIDE_INTERVAL_MS = 6000;

export function HeroBanner() {
  const { data } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: () => apiClient.getHeroSlides(),
  });

  const slides: HeroSlide[] = useMemo(() => data ?? [], [data]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[index];

  const backgroundStyle = activeSlide?.image_url
    ? {
        backgroundImage: `linear-gradient(rgba(20,30,20,0.7), rgba(20,30,20,0.7)), url(${activeSlide.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  if (!slides.length) {
    return (
      <section className="bg-gradient-to-r from-forest-900 to-forest-700 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-5xl font-bold">
            Amaze Gaming × <span className="text-lime-400">AmzCraft</span>
          </h1>
          <p className="mb-8 text-xl text-forest-100">
            Experience the ultimate Minecraft adventure with our community
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="bg-lime-500 text-forest-900 hover:bg-lime-400"
              onClick={() => window.open('https://discord.gg/amzcraft', '_blank')}
            >
              Join Discord
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-forest-900"
              onClick={() => navigator.clipboard.writeText('play.amzcraft.xyz:25565')}
            >
              Copy Server IP
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden py-24 text-white"
      style={backgroundStyle ?? { background: 'linear-gradient(135deg, #0c240c 0%, #1a431a 100%)' }}
    >
      <div className="container mx-auto px-6 text-center sm:px-8">
        <span className="text-sm uppercase tracking-widest text-lime-300">Amaze Gaming × AmzCraft</span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">{activeSlide.title}</h1>
        {activeSlide.subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-forest-100">{activeSlide.subtitle}</p>
        ) : null}

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="bg-lime-500 text-forest-900 hover:bg-lime-400"
            onClick={() => window.open('https://discord.gg/amzcraft', '_blank')}
          >
            Join Discord
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-forest-900"
            onClick={() => navigator.clipboard.writeText('play.amzcraft.xyz:25565')}
          >
            Copy Server IP
          </Button>
          {activeSlide.button_url ? (
            <Button
              size="lg"
              variant="ghost"
              className="text-lime-300 hover:text-lime-100"
              onClick={() => window.open(activeSlide.button_url ?? '#', '_blank')}
            >
              {activeSlide.button_text || 'Learn more'}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-10 flex justify-center gap-2">
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.id}
            className={`h-2 w-8 rounded-full transition ${slideIndex === index ? 'bg-lime-400' : 'bg-white/30'}`}
            onClick={() => setIndex(slideIndex)}
            aria-label={`View slide ${slideIndex + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
