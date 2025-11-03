import { useEffect, useRef, useState } from 'react';
import { QueryClient, useQuery } from '@tanstack/react-query';

import {
  HomepageFeature,
  HomepageHeroSlide,
  HomepageNewsSummary,
  HomepageRankProduct,
  HomepageServerStatus,
  HomepageSocialLinks,
  HomepageVoteLink,
} from './types';

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }
  return (await res.json()) as T;
};

const mapHeroSlide = (slide: any): HomepageHeroSlide => ({
  id: slide.id,
  title: slide.title,
  subtitle: slide.subtitle ?? undefined,
  imageUrl: slide.image_url ?? '',
  ctaText: slide.button_text ?? undefined,
  ctaUrl: slide.button_url ?? undefined,
  order: slide.display_order ?? 0,
});

const mapServerStatus = (status: any): HomepageServerStatus => {
  const metadata = status?.meta_data ?? status?.metadata ?? {};
  return {
    online: status?.status === 'online',
    player_count: status?.players_online ?? status?.player_count ?? 0,
    motd: status?.motd ?? metadata?.motd ?? undefined,
    version: metadata?.version ?? status?.version ?? undefined,
    uptime: metadata?.uptime ?? undefined,
    last_checked: status?.recorded_at ?? status?.last_checked ?? undefined,
    java_ip: metadata?.java_ip ?? 'play.amzcraft.xyz:25565',
    bedrock_ip: metadata?.bedrock_ip ?? 'bedrock.amzcraft.xyz:19132',
  };
};

const mapVoteLink = (vote: any): HomepageVoteLink => ({
  id: vote.id,
  title: vote.title,
  url: vote.url,
  reward: Array.isArray(vote.rewards) ? vote.rewards.join(', ') : vote.reward ?? undefined,
  cta: vote.button_text ?? vote.cta ?? 'Vote Now',
  order: vote.display_order ?? 0,
});

const mapFeature = (feature: any): HomepageFeature => ({
  id: feature.id,
  title: feature.title,
  description: feature.description,
  icon: feature.icon ?? undefined,
  order: feature.display_order ?? 0,
});

const mapProduct = (product: any): HomepageRankProduct => ({
  code: product.rank_code ?? product.code,
  name: product.display_name ?? product.name ?? product.rank_code ?? 'Rank',
  price_bdt:
    typeof product.price_bdt === 'string'
      ? Number(product.price_bdt)
      : typeof product.price_bdt === 'number'
        ? product.price_bdt
        : undefined,
  duration_days: product.duration_days ?? undefined,
  description: product.description ?? undefined,
});

const mapNews = (news: any): HomepageNewsSummary => ({
  slug: news.slug,
  title: news.title,
  summary: news.summary ?? '',
  pinned: news.is_pinned ?? news.pinned ?? false,
  published_at: news.published_at ?? news.created_at ?? new Date().toISOString(),
});

export const useHero = () =>
  useQuery({
    queryKey: ['hero'],
    queryFn: async () => {
      const data = await fetcher<any[]>('/api/hero-slides');
      return data.map(mapHeroSlide).sort((a, b) => a.order - b.order);
    },
  });

export const useStatus = () =>
  useQuery({
    queryKey: ['status'],
    queryFn: async () => mapServerStatus(await fetcher<any>('/api/status')),
    refetchInterval: 15000,
  });

export const useVotes = () =>
  useQuery({
    queryKey: ['votes'],
    queryFn: async () => {
      const data = await fetcher<any[]>('/api/votes');
      return data.map(mapVoteLink).sort((a, b) => a.order - b.order);
    },
  });

export const useFeatures = () =>
  useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const data = await fetcher<any[]>('/api/features');
      return data.map(mapFeature).sort((a, b) => a.order - b.order);
    },
  });

export const useRanks = () =>
  useQuery({
    queryKey: ['ranks'],
    queryFn: async () => {
      const data = await fetcher<any[]>('/api/payments/products');
      return data.map(mapProduct);
    },
  });

export const useNews = () =>
  useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const data = await fetcher<any[]>('/api/news');
      return data.map(mapNews);
    },
  });

export const useSocial = () =>
  useQuery({
    queryKey: ['social'],
    queryFn: () => fetcher<HomepageSocialLinks>('/api/social'),
  });

export const useStatusWS = (initial?: HomepageServerStatus) => {
  const [live, setLive] = useState<HomepageServerStatus | undefined>(initial);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws/status`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const payload = message?.payload ?? message?.data;
        if (message?.type === 'server_status' && payload) {
          setLive(mapServerStatus(payload));
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  return live;
};

export const prefetchFeatures = (queryClient: QueryClient) =>
  queryClient.prefetchQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const data = await fetcher<any[]>('/api/features');
      return data.map(mapFeature).sort((a, b) => a.order - b.order);
    },
  });

export const prefetchNews = (queryClient: QueryClient) =>
  queryClient.prefetchQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const data = await fetcher<any[]>('/api/news');
      return data.map(mapNews);
    },
  });
