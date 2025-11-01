import { z } from 'zod';

export const ServerStatusSchema = z.object({
  status: z.string(),
  players_online: z.number(),
  players_max: z.number(),
  motd: z.string().nullable(),
  recorded_at: z.string(),
  metadata: z.record(z.any()),
});

export const NewsPostSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  content: z.string().optional(),
  published_at: z.string().nullable(),
  is_pinned: z.boolean(),
});

export const EventSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
  location: z.string().nullable(),
  is_active: z.boolean(),
});

export const RuleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  category: z.string().nullable(),
  display_order: z.number(),
  is_pinned: z.boolean(),
});

export const RankProductSchema = z.object({
  id: z.string(),
  rank_code: z.string(),
  display_name: z.string(),
  price_bdt: z.string(),
  duration_days: z.number().nullable(),
  description: z.string().nullable(),
  is_active: z.boolean(),
});

export const PaymentRequestSchema = z.object({
  id: z.string(),
  rank_product: RankProductSchema,
  mc_username: z.string(),
  bkash_txid: z.string(),
  amount_bdt: z.string(),
  screenshot_url: z.string().nullable(),
  status: z.string(),
  rejection_reason: z.string().nullable(),
  created_at: z.string(),
  processed_at: z.string().nullable(),
});

export const SocialLinksSchema = z.object({
  facebook: z.string().nullable(),
  twitter: z.string().nullable(),
  discord: z.string().nullable(),
  youtube: z.string().nullable(),
  tiktok: z.string().nullable(),
  instagram: z.string().nullable(),
});

export const UserSchema = z.object({
  id: z.string(),
  discord_id: z.string(),
  username: z.string(),
  email: z.string().nullable(),
  avatar: z.string().nullable(),
  roles: z.array(z.string()),
});

export type ServerStatus = z.infer<typeof ServerStatusSchema>;
export type NewsPost = z.infer<typeof NewsPostSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type RankProduct = z.infer<typeof RankProductSchema>;
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;
export type User = z.infer<typeof UserSchema>;