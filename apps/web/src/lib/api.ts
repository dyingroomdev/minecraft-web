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
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
    return this.request(`/api/players/${uuid}`);
  }

  async getSocialLinks() {
    return this.request('/api/social', {}, SocialLinksSchema);
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
  }>) {
    return this.request('/admin/social', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, SocialLinksSchema);
  }
}

export const apiClient = new ApiClient(API_BASE);