import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const manzai = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/manzai' }),
  schema: z.object({
    title: z.string(),
    performers: z.array(
      z.object({
        name: z.string(),
        members: z.array(z.string()).optional().default([]),
      })
    ),
    source: z.object({
      platform: z.enum(['youtube', 'bilibili', 'local', 'other']),
      url: z.string(),
      uploader: z.string().optional(),
      uploaded_at: z
        .union([z.string(), z.date()])
        .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))
        .optional(),
      duration_sec: z.number().optional(),
    }),
    // ISO 639-1 code, free-form so Whisper-detected codes work without enum churn
    language: z.string().default('ja'),
    tags: z.array(z.string()).default([]),
    speakers: z.record(z.string(), z.string()).default({}),
    sensitivity: z.enum(['normal', 'high']).default('normal'),
    status: z.enum(['draft', 'reviewed']).default('draft'),
    contributed_by: z.string().optional(),
    license_note: z.string().optional(),
    // Per-line translations. Each value must be an array with the same
    // length as the script body's line count, in the same order.
    // Mismatched lengths are silently ignored at render time.
    translations: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export const collections = { manzai };
