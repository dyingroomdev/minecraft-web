import { z } from 'zod';
import {
  ServerStatusSchema,
  NewsPostSchema,
  EventSchema,
  RuleSchema,
  RankProductSchema,
  PaymentRequestSchema,
  SocialLinksSchema,
  UserSchema,
  VoteLinkSchema,
  LeaderboardSchema,
  PlayerProfileSchema,
  HeroSlideSchema,
  ServerFeatureSchema,
  HeroSlideCreateSchema,
  ServerFeatureCreateSchema,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: options.credentials ?? 'include',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();
    return schema ? schema.parse(data) : data;
  }

  // Public endpoints
  async getServerStatus() {
    return this.request('/api/status', {}, ServerStatusSchema);
  }

  async getNews() {
    return this.request('/api/news', {}, z.array(NewsPostSchema));
  }

  async getNewsPost(slug: string) {
    return this.request(`/api/news/${slug}`, {}, NewsPostSchema);
  }

  async getRules() {
    return this.request('/api/rules', {}, z.array(RuleSchema));
  }

  async getActiveEvents() {
    return this.request('/api/events/active', {}, z.array(EventSchema));
  }

  async getLeaderboard(season: string, type: string) {
    return this.request(`/api/leaderboards/${season}/${type}`);
  }

  async getPlayer(uuid: string) {
    return this.request(`/api/players/${uuid}`, {}, PlayerProfileSchema);
  }

  async getSocialLinks() {
    return this.request('/api/social', {}, SocialLinksSchema);
  }

  async getVoteLinks() {
    return this.request('/api/votes', {}, z.array(VoteLinkSchema));
  }

  async getHeroSlides() {
    return this.request('/api/hero-slides', {}, z.array(HeroSlideSchema));
  }

  async getServerFeatures() {
    return this.request('/api/features', {}, z.array(ServerFeatureSchema));
  }

  async getRankProducts() {
    return this.request('/api/payments/products', {}, z.array(RankProductSchema));
  }

  async submitPayment(data: {
    rank_code: string;
    mc_username: string;
    bkash_txid: string;
    amount_bdt: string;
    screenshot_url?: string;
  }) {
    return this.request('/api/payments/bkash/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }, PaymentRequestSchema);
  }

  // Auth endpoints
  async getMe() {
    return this.request('/me', {}, UserSchema);
  }

  async refreshToken() {
    return this.request('/auth/refresh', { method: 'POST' });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Admin endpoints
  async getPayments(status = 'pending') {
    return this.request(`/admin/payments?status=${status}`, {}, z.array(PaymentRequestSchema));
  }

  async approvePayment(paymentId: string, idempotencyKey: string) {
    return this.request(`/admin/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    }, PaymentRequestSchema);
  }

  async rejectPayment(paymentId: string, reason: string) {
    return this.request(`/admin/payments/${paymentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }, PaymentRequestSchema);
  }

  async updateSocialLinks(data: Partial<{
    facebook: string;
    twitter: string;
    discord: string;
    youtube: string;
    tiktok: string;
    instagram: string;
    website: string;
  }>) {
    return this.request('/admin/social', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, SocialLinksSchema);
  }

  async getHeroSlidesAdmin() {
    return this.request('/admin/hero-slides', {}, z.array(HeroSlideSchema));
  }

  async createHeroSlide(data: z.infer<typeof HeroSlideCreateSchema>) {
    return this.request('/admin/hero-slides', {
      method: 'POST',
      body: JSON.stringify(data),
    }, HeroSlideSchema);
  }

  async updateHeroSlide(id: string, data: Partial<z.infer<typeof HeroSlideSchema>>) {
    return this.request(`/admin/hero-slides/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, HeroSlideSchema);
  }

  async deleteHeroSlide(id: string) {
    await this.request(`/admin/hero-slides/${id}`, { method: 'DELETE' });
  }

  async getServerFeaturesAdmin() {
    return this.request('/admin/features', {}, z.array(ServerFeatureSchema));
  }

  async createServerFeature(data: z.infer<typeof ServerFeatureCreateSchema>) {
    return this.request('/admin/features', {
      method: 'POST',
      body: JSON.stringify(data),
    }, ServerFeatureSchema);
  }

  async updateServerFeature(id: string, data: Partial<z.infer<typeof ServerFeatureSchema>>) {
    return this.request(`/admin/features/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, ServerFeatureSchema);
  }

  async deleteServerFeature(id: string) {
    await this.request(`/admin/features/${id}`, { method: 'DELETE' });
  }

  async getLeaderboard(season: string, type: string) {
    return this.request(`/api/leaderboards/${season}/${type}`, {}, LeaderboardSchema);
  }

  async getPaymentRequest(id: string) {
    return this.request(`/api/payments/requests/${id}`, {}, PaymentRequestSchema);
  }

  async discordOAuthCallback(code: string, state: string) {
    return this.request(
      `/auth/discord/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      { method: 'GET' },
      z.object({
        access_token: z.string(),
        token_type: z.string(),
        expires_at: z.string(),
        refresh_expires_at: z.string(),
        roles: z.array(z.string()),
      })
    );
  }
}

export const apiClient = new ApiClient(API_BASE);
