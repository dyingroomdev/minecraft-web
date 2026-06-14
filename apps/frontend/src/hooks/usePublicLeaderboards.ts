import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import type { LeaderboardIndexItem, LeaderboardSeasonPayload } from '@/lib/types';

const FALLBACK_INDEX: LeaderboardIndexItem[] = [
  {
    season: 'season-1',
    title: 'Season 1',
    start: '2024-01-01',
    end: '2024-03-31',
    types: ['score', 'kills', 'blocks'],
  },
  {
    season: 'season-2',
    title: 'Season 2',
    start: '2024-04-01',
    end: '2024-06-30',
    types: ['score', 'playtime', 'quests'],
  },
  {
    season: 'season-3',
    title: 'Season 3',
    start: '2024-07-01',
    end: '2024-09-30',
    types: ['score', 'events', 'guild'],
  },
];

export function useLbIndex() {
  return useQuery<LeaderboardIndexItem[]>({
    queryKey: ['lb-index'],
    queryFn: async () => {
      try {
        return await apiClient.getLeaderboardIndex();
      } catch (error) {
        console.warn('[Leaderboards] Falling back to static index', error);
        return FALLBACK_INDEX;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useLeaderboard(season: string | undefined, type: string | undefined) {
  return useQuery<LeaderboardSeasonPayload>({
    queryKey: ['lb', season, type],
    queryFn: async () => {
      if (!season || !type) {
        throw new Error('Missing season or type');
      }
      return apiClient.getLeaderboard(season, type);
    },
    enabled: Boolean(season && type),
    staleTime: 60_000,
  });
}
