const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export function resolveMediaUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (/^(?:https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  return `${API_BASE}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}
