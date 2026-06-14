import type { LeaderboardIndexItem, LeaderboardSeasonEntry } from './types';

const API_BASE = (import.meta.env.VITE_API_URL ?? window.location.origin).replace(/\/$/, '');
export const EMOJI_BASE_URL = `${API_BASE}/api/media/emojis`;

const CARD_EMOJIS = [
  '41742-mcgold.png',
  '433076-minecraft-diamond-sparkle.gif',
  '960733-villagehero.gif',
  '403691-minecraft.png',
  '713404-play.gif',
  '5247-enderdragon.gif',
  '83918-animatedarrowgreen.gif',
];

export function emojiForIndex(index: number): string {
  const file = CARD_EMOJIS[index % CARD_EMOJIS.length];
  return `${EMOJI_BASE_URL}/${file}`;
}

export function formatSeasonDates(item: LeaderboardIndexItem): string {
  if (!item.start && !item.end) {
    return 'Dates TBA';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const start = item.start ? formatter.format(new Date(item.start)) : 'TBA';
  const end = item.end ? formatter.format(new Date(item.end)) : 'present';
  return `${start} → ${end}`;
}

export function isSeasonLive(item: LeaderboardIndexItem): boolean {
  if (typeof item.is_live === 'boolean') return item.is_live;
  if (!item.end) return true;
  return new Date(item.end).getTime() > Date.now();
}

export function timeAgo(value?: string): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function deriveColumns(entries: LeaderboardSeasonEntry[]): string[] {
  const metaKeys = new Set<string>();
  entries.forEach((entry) => {
    Object.keys(entry.metadata ?? {}).forEach((key) => metaKeys.add(key));
  });
  return ['rank', 'player', 'score', ...Array.from(metaKeys)];
}

export function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.join(',');
  const data = rows
    .map((row) => columns.map((column) => escape(row[column])).join(','))
    .join('\n');

  return `${header}\n${data}`;
}

export function filterEntries(entries: LeaderboardSeasonEntry[], query: string): LeaderboardSeasonEntry[] {
  if (!query.trim()) return entries;
  const term = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (entry.player.toLowerCase().includes(term)) return true;
    const metadata = entry.metadata ?? {};
    return Object.values(metadata).some((value) => {
      if (typeof value === 'string' || typeof value === 'number') {
        return String(value).toLowerCase().includes(term);
      }
      return false;
    });
  });
}

export function buildShareUrl(type: string, search: string): string {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  params.set('type', type);
  if (search.trim()) {
    params.set('q', search.trim());
  } else {
    params.delete('q');
  }
  url.search = params.toString();
  return url.toString();
}

export function extractQueryParams(search: string): { type?: string; q?: string } {
  const params = new URLSearchParams(search);
  const type = params.get('type') ?? undefined;
  const q = params.get('q') ?? undefined;
  return { type, q };
}
