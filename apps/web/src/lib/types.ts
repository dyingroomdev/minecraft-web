import { z } from 'zod';

export const LeaderboardEntrySchema = z.object({
  player: z.string(),
  score: z.union([z.number(), z.string()]),
  position: z.number(),
  metadata: z.record(z.any()).default({}),
});

export const LeaderboardSchema = z.object({
  id: z.string(),
  season: z.string(),
  leaderboard_type: z.string(),
  title: z.string().nullable(),
  entries: z.array(LeaderboardEntrySchema),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const PlayerGuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  tag: z.string(),
});

export const PlayerRankSchema = z.object({
  id: z.string(),
  name: z.string(),
  display_name: z.string(),
  priority: z.number(),
});

export const PlayerProfileSchema = z.object({
  id: z.string(),
  minecraft_uuid: z.string(),
  username: z.string(),
  stats: z.record(z.any()).default({}),
  rank: PlayerRankSchema.nullable(),
  guild: PlayerGuildSchema.nullable(),
});

export const ServerStatusSchema = z.object({
  status: z.string(),
  players_online: z.number(),
  players_max: z.number(),
  motd: z.string().nullable(),
  recorded_at: z.string(),
  metadata: z
    .object({
      version: z.string().optional(),
      sample: z.array(z.record(z.any())).optional(),
      ping: z.number().optional(),
      tps: z.number().nullable().optional(),
    })
    .passthrough()
    .default({}),
});

export const NewsPostSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  content: z.string().optional(),
  cover_image_url: z.string().nullable().optional(),
  published_at: z.string().nullable(),
  scheduled_publish_at: z.string().nullable().optional(),
  is_pinned: z.boolean().default(false),
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
  price_bdt: z.union([z.string(), z.number()]).transform((value) => value.toString()),
  duration_days: z.number().nullable(),
  description: z.string().nullable(),
  is_active: z.boolean(),
});

export const PaymentRequestSchema = z.object({
  id: z.string(),
  rank_product: RankProductSchema,
  mc_username: z.string(),
  mc_uuid: z.string().nullable().optional(),
  bkash_txid: z.string(),
  amount_bdt: z.union([z.string(), z.number()]).transform((value) => value.toString()),
  screenshot_url: z.string().nullable(),
  status: z.string(),
  rejection_reason: z.string().nullable(),
  created_at: z.string(),
  processed_at: z.string().nullable(),
  meta_data: z.record(z.any()).optional(),
});

export const SocialLinksSchema = z.object({
  facebook: z.string().nullable(),
  twitter: z.string().nullable(),
  discord: z.string().nullable(),
  youtube: z.string().nullable(),
  tiktok: z.string().nullable(),
  instagram: z.string().nullable(),
  website: z.string().nullable(),
});

export const UserSchema = z.object({
  id: z.string(),
  discord_id: z.string(),
  username: z.string(),
  email: z.string().nullable(),
  avatar: z.string().nullable(),
  roles: z.array(z.string()),
});

export const VoteLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  button_text: z.string(),
  rewards: z.array(z.string()).default([]),
  display_order: z.number(),
  is_active: z.boolean().default(true),
});

export const HeroSlideSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  image_url: z.string().nullable(),
  button_text: z.string().nullable(),
  button_url: z.string().nullable(),
  display_order: z.number(),
  is_active: z.boolean().default(true),
});

export const ServerFeatureSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string().nullable(),
  display_order: z.number(),
  is_active: z.boolean().default(true),
});

export const HeroSlideCreateSchema = HeroSlideSchema.omit({ id: true });
export const ServerFeatureCreateSchema = ServerFeatureSchema.omit({ id: true });

export type ServerStatus = z.infer<typeof ServerStatusSchema>;
export type NewsPost = z.infer<typeof NewsPostSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type RankProduct = z.infer<typeof RankProductSchema>;
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;
export type User = z.infer<typeof UserSchema>;
export type VoteLink = z.infer<typeof VoteLinkSchema>;
export type Leaderboard = z.infer<typeof LeaderboardSchema>;
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
export type HeroSlide = z.infer<typeof HeroSlideSchema>;
export type ServerFeature = z.infer<typeof ServerFeatureSchema>;
