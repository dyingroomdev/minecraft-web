import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import HeroSlider from '@/components/pages/home/HeroSlider';
import ServerStatus from '@/components/pages/home/ServerStatus';
import VoteBanner from '@/components/pages/home/VoteBanner';
import Features from '@/components/pages/home/Features';
import RanksTeaser from '@/components/pages/home/RanksTeaser';
import NewsTeaser from '@/components/pages/home/NewsTeaser';
import { prefetchFeatures, prefetchNews } from '@/lib/hooks';

export default function Home() {
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    let prefetched = false;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefetched) {
            prefetched = true;
            prefetchFeatures(queryClient);
            prefetchNews(queryClient);
          }
        });
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [queryClient]);

  return (
    <main className="bg-bg text-on">
      <HeroSlider />
      <ServerStatus />
      <div ref={sentinelRef} />
      <VoteBanner />
      <Features />
      <RanksTeaser />
      <NewsTeaser />
    </main>
  );
}
