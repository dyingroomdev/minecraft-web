import { z } from 'zod';

export const SeoSchema = z.object({
  default_title: z.string().min(1).max(70),
  title_template: z.string().min(1).max(120),
  meta_description: z.string().min(1).max(160),
  canonical_base_url: z.string().url().startsWith('https://'),
  og_image_url: z.string().url().nullish(),
  twitter_handle: z.string().regex(/^@?[A-Za-z0-9_]{1,15}$/).nullish(),
  robots_policy: z.enum(['index,follow','noindex,nofollow','index,nofollow','noindex,follow']),
  sitemap_enabled: z.boolean(),
});

export type SeoFormData = z.infer<typeof SeoSchema>;