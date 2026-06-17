import { z, type ZodSchema } from 'zod';

import {
  EventSchema,
  HeroSlideSchema,
  LeaderboardSchema,
  LeaderboardSeasonSchema,
  LeaderboardIndexItemSchema,
  NewsPostSchema,
  PaymentRequestSchema,
  PaymentRetryResponseSchema,
  PlayerProfileSchema,
  RankProductSchema,
  RankProductAdminSchema,
  StackModeSchema,
  RuleSchema,
  ServerFeatureSchema,
  SocialLinksSchema,
  TopVotersSchema,
  UserSchema,
  VoteLinkSchema,
} from './types';
import type {
  Event,
  HeroSlide,
  Leaderboard,
  LeaderboardSeasonPayload,
  LeaderboardIndexItem,
  NewsPost,
  PaymentRequest,
  PlayerProfile,
  RankProduct,
  RankProductAdmin,
  StackMode,
  Rule,
  ServerFeature,
  ServerStatus,
  SocialLinks,
  TopVoters,
  User,
  VoteLink,
} from './types';

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_at?: string;
  refresh_expires_at?: string;
  roles?: string[];
};

type PaymentRetryResponse = z.infer<typeof PaymentRetryResponseSchema>;

export type ContactRequest = {
  id: string;
  request_type: 'ban_appeal' | 'bug_report' | 'staff_application' | 'contact';
  name: string;
  email: string;
  minecraft_username: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const DEFAULT_API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const DEFAULT_WS_BASE = import.meta.env.VITE_WS_URL ?? null;
const PRODUCTION_API_BASE = 'https://api.amzcraft.top';

class ApiClient {
  private token: string | null = null;

  constructor(private readonly baseUrl: string) {}

  setToken(token: string | null) {
    this.token = token;
  }

  async request<T = unknown>(
    path: string,
    init: RequestInit = {},
    schema?: ZodSchema<T>,
  ): Promise<T> {
    const response = await this.fetch(path, init);
    const payload = await this.parseResponse(response);

    if (!response.ok) {
      throw new Error(this.normalizeError(payload, response));
    }

    if (schema && payload !== undefined) {
      return schema.parse(payload);
    }

    return payload as T;
  }

  async getServerStatus(): Promise<any> {
    return this.request('/api/status');
  }

  async getNews(): Promise<NewsPost[]> {
    return this.request('/api/news', undefined, z.array(NewsPostSchema));
  }

  async getNewsPost(slug: string): Promise<NewsPost> {
    return this.request(`/api/news/${encodeURIComponent(slug)}`, undefined, NewsPostSchema);
  }

  async getVoteLinks(): Promise<VoteLink[]> {
    return this.request('/api/votes', undefined, z.array(VoteLinkSchema));
  }

  async getTopVoters(): Promise<TopVoters> {
    let primary: TopVoters | null = null;
    try {
      primary = await this.request('/api/votes/top', undefined, TopVotersSchema);
      if (primary.entries.length > 0 || this.baseUrl === PRODUCTION_API_BASE) {
        return primary;
      }
    } catch (error) {
      if (this.baseUrl === PRODUCTION_API_BASE) {
        throw error;
      }
    }

    const fallback = await this.request(`${PRODUCTION_API_BASE}/api/votes/top`, undefined, TopVotersSchema);
    return fallback.entries.length > 0 || primary === null ? fallback : primary;
  }

  async getEvents(): Promise<Event[]> {
    return this.request('/api/events', undefined, z.array(EventSchema));
  }

  async getEvent(slug: string): Promise<Event> {
    return this.request(`/api/events/${encodeURIComponent(slug)}`, undefined, EventSchema);
  }

  async downloadEventsCalendar(): Promise<Blob> {
    const response = await this.fetchRaw('/api/events/calendar.ics', {
      headers: { Accept: 'text/calendar' },
    });
    return response.blob();
  }

  async getRules(): Promise<Rule[]> {
    return this.request('/api/rules', undefined, z.array(RuleSchema));
  }

  async getRankProducts(): Promise<RankProduct[]> {
    return this.request('/api/payments/products', undefined, z.array(RankProductSchema));
  }

  async getRankProductsAdmin(): Promise<RankProductAdmin[]> {
    return this.request('/admin/rank-products', undefined, z.array(RankProductAdminSchema));
  }

  async updateRankProductLpMapping(
    id: string,
    payload: { lp_group: string | null; stack_mode: StackMode },
  ): Promise<RankProductAdmin> {
    return this.request(
      `/admin/rank-products/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      RankProductAdminSchema,
    );
  }

  async getLuckPermsGroups(): Promise<string[]> {
    return this.request('/admin/luckperms/groups', undefined, z.array(z.string()));
  }

  async submitPayment(payload: {
    rank_code: string;
    mc_username: string;
    bkash_txid: string;
    amount_bdt: string | number;
    screenshot_url?: string | null;
  }): Promise<PaymentRequest> {
    return this.request(
      '/api/payments/bkash/submit',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      PaymentRequestSchema,
    );
  }

  async getPaymentRequest(id: string): Promise<PaymentRequest> {
    return this.request(
      `/api/payments/payments/requests/${encodeURIComponent(id)}`,
      undefined,
      PaymentRequestSchema,
    );
  }

  async getPlayer(identifier: string): Promise<PlayerProfile> {
    return this.request(
      `/api/players/${encodeURIComponent(identifier)}`,
      undefined,
      PlayerProfileSchema,
    );
  }

  async getLeaderboard(season: string, type: string): Promise<LeaderboardSeasonPayload> {
    return this.request(
      `/api/leaderboards/${encodeURIComponent(season)}/${encodeURIComponent(type)}`,
      undefined,
      LeaderboardSeasonSchema,
    );
  }

  async getLeaderboardIndex(): Promise<LeaderboardIndexItem[]> {
    return this.request('/api/leaderboards/index', undefined, z.array(LeaderboardIndexItemSchema));
  }

  async getSocialLinks(): Promise<SocialLinks> {
    return this.request('/api/social', undefined, SocialLinksSchema);
  }

  async getHeroSlidesAdmin(): Promise<HeroSlide[]> {
    return this.request('/admin/hero-slides', undefined, z.array(HeroSlideSchema));
  }

  async createHeroSlide(payload: {
    title: string;
    subtitle?: string;
    image_url?: string;
    button_text?: string;
    button_url?: string;
    display_order: number;
    is_active: boolean;
  }): Promise<HeroSlide> {
    return this.request(
      '/admin/hero-slides',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      HeroSlideSchema,
    );
  }

  async updateHeroSlide(id: string, payload: Partial<HeroSlide>): Promise<HeroSlide> {
    return this.request(
      `/admin/hero-slides/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      HeroSlideSchema,
    );
  }

  async deleteHeroSlide(id: string): Promise<void> {
    await this.request(`/admin/hero-slides/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async getServerFeaturesAdmin(): Promise<ServerFeature[]> {
    return this.request('/admin/features', undefined, z.array(ServerFeatureSchema));
  }

  async createServerFeature(payload: {
    title: string;
    description: string;
    icon?: string;
    display_order: number;
    is_active: boolean;
  }): Promise<ServerFeature> {
    return this.request(
      '/admin/features',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      ServerFeatureSchema,
    );
  }

  async updateServerFeature(id: string, payload: Partial<ServerFeature>): Promise<ServerFeature> {
    return this.request(
      `/admin/features/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      ServerFeatureSchema,
    );
  }

  async deleteServerFeature(id: string): Promise<void> {
    await this.request(`/admin/features/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async getAdminRules(): Promise<Rule[]> {
    return this.request('/admin/rules', undefined, z.array(RuleSchema));
  }

  async reorderRules(order: string[]): Promise<void> {
    await this.request('/admin/rules/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
  }

  async getDiagnostics(): Promise<any> {
    return this.request('/admin/diagnostics/');
  }

  async getContactRequests(status?: string): Promise<ContactRequest[]> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/admin/contact-requests${query}`);
  }

  async updateContactRequestStatus(id: string, status: string): Promise<ContactRequest> {
    return this.request(`/admin/contact-requests/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  async getPayments(statusFilter = 'pending'): Promise<PaymentRequest[]> {
    const query = new URLSearchParams({ status_filter: statusFilter });
    return this.request(`/admin/payments?${query.toString()}`, undefined, z.array(PaymentRequestSchema));
  }

  async approvePayment(id: string, idempotencyKey: string): Promise<PaymentRequest> {
    return this.request(
      `/admin/payments/${encodeURIComponent(id)}/approve`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      },
      PaymentRequestSchema,
    );
  }

  async rejectPayment(id: string, reason: string): Promise<PaymentRequest> {
    return this.request(
      `/admin/payments/${encodeURIComponent(id)}/reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      },
      PaymentRequestSchema,
    );
  }

  async retryPayment(id: string): Promise<PaymentRetryResponse> {
    return this.request(
      `/admin/retry/${encodeURIComponent(id)}`,
      {
        method: 'POST',
      },
      PaymentRetryResponseSchema,
    );
  }

  async exportAuditLogs(limit?: number): Promise<Blob> {
    const query = typeof limit === 'number' ? `?limit=${encodeURIComponent(limit)}` : '';
    const response = await this.fetchRaw(`/admin/audit/export${query}`, {
      headers: { Accept: 'text/csv' },
    });
    return response.blob();
  }

  async uploadMedia(file: File): Promise<{ filename: string; url: string; content_type?: string; size?: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/admin/media/', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadLeaderboard(payload: {
    season: string;
    leaderboard_type: string;
    file: File;
    title?: string | null;
  }): Promise<Leaderboard> {
    const formData = new FormData();
    formData.append('season', payload.season);
    formData.append('leaderboard_type', payload.leaderboard_type);
    if (payload.title) {
      formData.append('title', payload.title);
    }
    formData.append('file', payload.file);

    return this.request(
      '/admin/leaderboards/upload',
      {
        method: 'POST',
        body: formData,
      },
      LeaderboardSchema,
    );
  }

  async updateSocialLinks(update: Partial<SocialLinks>): Promise<SocialLinks> {
    return this.request(
      '/admin/social',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      },
      SocialLinksSchema,
    );
  }

  async getServerStatusForAdmin(): Promise<ServerStatus> {
    return this.getServerStatus();
  }

  async getPaymentsDashboard(status = 'pending'): Promise<PaymentRequest[]> {
    return this.getPayments(status);
  }

  async discordOAuthCallback(code: string, state: string): Promise<TokenResponse> {
    const params = new URLSearchParams({ code, state });
    return this.request<TokenResponse>(`/auth/discord/callback?${params.toString()}`);
  }

  async refreshToken(): Promise<TokenResponse> {
    const tokens = await this.request<TokenResponse>('/auth/refresh', {
      method: 'POST',
    });
    this.setToken(tokens.access_token);
    return tokens;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getMe(): Promise<User> {
    return this.request('/users/me', undefined, UserSchema);
  }

  async getPaymentsPublicStatus(id: string): Promise<PaymentRequest> {
    return this.getPaymentRequest(id);
  }

  async requestRaw(path: string, init: RequestInit = {}): Promise<unknown> {
    return this.request(path, init);
  }

  private resolveUrl(path: string): string {
    if (ABSOLUTE_URL_PATTERN.test(path)) {
      return path;
    }

    if (!this.baseUrl) {
      return path;
    }

    if (path.startsWith('/')) {
      return `${this.baseUrl}${path}`;
    }

    return `${this.baseUrl}/${path}`;
  }

  private async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const url = this.resolveUrl(path);
    const headers = new Headers(init.headers ?? undefined);

    if (!headers.has('Authorization')) {
      if (this.token) {
        headers.set('Authorization', `Bearer ${this.token}`);
      } else {
        const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (adminToken) {
          headers.set('Authorization', `Bearer ${adminToken}`);
        }
      }
    }

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    return fetch(url, {
      ...init,
      headers,
      credentials: init.credentials ?? 'include',
    });
  }

  private async fetchRaw(path: string, init: RequestInit = {}): Promise<Response> {
    const response = await this.fetch(path, init);
    if (!response.ok) {
      const payload = await this.parseResponse(response);
      throw new Error(this.normalizeError(payload, response));
    }
    return response;
  }

  private async parseResponse(response: Response): Promise<unknown> {
    if (response.status === 204) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  }

  private normalizeError(payload: unknown, response: Response): string {
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      if (typeof record.detail === 'string') {
        return record.detail;
      }
      if (Array.isArray(record.detail)) {
        return record.detail.map(String).join(', ');
      }
      if (typeof record.message === 'string') {
        return record.message;
      }
    }

    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload;
    }

    return `Request failed with status ${response.status}`;
  }
}

export const apiClient = new ApiClient(DEFAULT_API_BASE);

export function connectStatusWS(onMessage: (status: ServerStatus) => void) {
  const wsUrl = DEFAULT_WS_BASE
    ? DEFAULT_WS_BASE
    : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
  const socket = new WebSocket(`${wsUrl.replace(/\/$/, '')}/ws/status`);

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed?.type === 'server_status') {
        const payload = parsed?.payload ?? parsed?.data ?? parsed;
        onMessage(payload);
      }
    } catch {
      // Ignore malformed websocket messages
    }
  };

  return socket;
}
