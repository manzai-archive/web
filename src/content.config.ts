import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const PerformerSchema = z.object({
  display_name: z.string(),
  display_name_alts: z.array(z.string()).optional().default([]),
  language: z.string(),
  region: z.string(),
  members: z
    .array(
      z.object({
        name: z.string(),
        role: z.string().optional(),
      })
    )
    .default([]),
  links: z.record(z.string(), z.string()).optional().default({}),
  description: z.string().optional(),
});

const performers = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/performers' }),
  schema: PerformerSchema,
});

const manzai = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/manzai' }),
  schema: z.object({
    title: z.string(),
    // Slugs that must resolve in the `performers` collection.
    performers: z.array(reference('performers')).min(1),
    source: z.object({
      platform: z.enum(['youtube', 'bilibili', 'local', 'other']),
      url: z.string(),
      uploader: z.string().optional(),
      uploaded_at: z
        .union([z.string(), z.date()])
        .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))
        .optional(),
      duration_sec: z.number().optional(),
      // Provenance: when/with-what we pulled it
      fetched_at: z.string().optional(),
      fetched_with: z.string().optional(),
    }),
    language: z.string().default('ja'),
    tags: z.array(z.string()).default([]),
    speakers: z.record(z.string(), z.string()).default({}),
    // Comedy form. Accepted values include: manzai (漫才), xiangsheng (相声),
    // standup (脱口秀 / スタンダップ), sketch (コント / 小品), rakugo (落語).
    form: z.string().default('manzai'),
    roles: z.record(z.string(), z.string()).optional(),
    sensitivity: z.enum(['normal', 'high']).default('normal'),
    status: z.enum(['draft', 'reviewed']).default('draft'),
    contributed_by: z.string().optional(),
    license_note: z.string().optional(),
    // Machine-written by the pipeline; lets us re-run when models improve.
    ingestion: z
      .object({
        pipeline_version: z.string().optional(),
        asr: z
          .object({
            backend: z.string(),
            model: z.string(),
            detected_language: z.string().optional(),
            word_count: z.number().optional(),
          })
          .optional(),
        diarization: z
          .object({
            model: z.string(),
            num_speakers: z.number().optional(),
            turn_count: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

// Dialogue is stored separately from the entry .md so it can be edited
// as structured data (per-utterance speaker / text / time) without
// touching the entry's metadata. Files live under src/content/dialogues
// and share the SAME slug as their entry .md.
const UtteranceSchema = z.object({
  id: z.string(),
  // HH:MM:SS — when this utterance starts in the source audio
  t: z.string(),
  speaker: z.string(),
  text: z.string(),
  // Per-utterance translations: { zh: "...", en: "..." }
  translations: z.record(z.string(), z.string()).optional(),
  // Editor metadata (for future audit trail / web editor)
  edited_by: z.string().optional(),
  edited_at: z.string().optional(),
  notes: z.string().optional(),
});

const dialogues = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/dialogues' }),
  schema: z.object({
    utterances: z.array(UtteranceSchema).default([]),
  }),
});

export const collections = { manzai, performers, dialogues };
