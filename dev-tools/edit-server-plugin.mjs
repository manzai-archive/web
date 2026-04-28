// Dev-only API for the in-browser editor. Mounted as a vite middleware
// during `astro dev`; never participates in `astro build`, so production
// (GitHub Pages) is read-only by construction.
//
// Routes (all under /api/dev):
//   POST   /api/dev/dialogue/:slug   body: { utterances: [...] }
//   POST   /api/dev/entry/:slug      body: { frontmatter: {...} }
//   POST   /api/dev/entry/new        body: { slug, frontmatter, utterances }
//   DELETE /api/dev/entry/:slug
//
// All slug values must NOT contain path separators; we strip them defensively.

import { promises as fs } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');
const DIALOGUES_DIR = join(ROOT, 'src/content/dialogues');
const ENTRIES_DIR = join(ROOT, 'src/content/manzai');

function safeSlug(s) {
  if (typeof s !== 'string') throw new Error('slug must be string');
  // Defensive: kill anything that could escape the dir.
  const cleaned = s.replace(/[/\\]/g, '_').replace(/^\.+/, '');
  if (!cleaned || cleaned.length > 200) throw new Error('invalid slug');
  return cleaned;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// ---------- YAML serialization (manual; matches PyYAML safe_dump style) ----

function quoteIfNeeded(s) {
  if (s === null || s === undefined) return "''";
  s = String(s);
  if (s === '') return "''";
  // YAML special chars / leading/trailing whitespace → double-quoted form
  if (
    /^[-?:,\[\]{}#&*!|>'"%@`]/.test(s) ||
    /[:#]\s/.test(s) ||
    /\n/.test(s) ||
    /^\s|\s$/.test(s) ||
    /^(true|false|null|yes|no|~)$/i.test(s) ||
    /^-?\d+(\.\d+)?$/.test(s)
  ) {
    return JSON.stringify(s);
  }
  return s;
}

function dumpDialogue(data) {
  const utterances = Array.isArray(data?.utterances) ? data.utterances : [];
  let out = 'utterances:\n';
  for (const u of utterances) {
    out += `- id: ${quoteIfNeeded(u.id ?? '')}\n`;
    out += `  t: ${quoteIfNeeded(u.t ?? '')}\n`;
    out += `  speaker: ${quoteIfNeeded(u.speaker ?? '')}\n`;
    out += `  text: ${quoteIfNeeded(u.text ?? '')}\n`;
    if (u.translations && typeof u.translations === 'object') {
      const keys = Object.keys(u.translations);
      if (keys.length > 0) {
        out += '  translations:\n';
        for (const k of keys) {
          out += `    ${k}: ${quoteIfNeeded(u.translations[k])}\n`;
        }
      }
    }
  }
  return out;
}

function dumpFrontmatter(fm) {
  // Pretty-print frontmatter. We write only well-known top-level keys in
  // a stable order; unknown keys are appended afterwards. Nested objects
  // are emitted in YAML "block" style so existing diff tools work.
  const order = [
    'title', 'performers', 'form', 'source', 'language', 'tags',
    'speakers', 'roles', 'sensitivity', 'status', 'contributed_by',
    'license_note', 'ingestion',
  ];
  const lines = [];
  const seen = new Set();
  const emit = (key) => {
    if (seen.has(key)) return;
    if (!(key in fm)) return;
    seen.add(key);
    emitKv(lines, key, fm[key], 0);
  };
  for (const k of order) emit(k);
  for (const k of Object.keys(fm)) emit(k);
  return lines.join('\n') + '\n';
}

function emitKv(out, key, val, indent) {
  const pad = ' '.repeat(indent);
  if (val === null || val === undefined) {
    out.push(`${pad}${key}: null`);
  } else if (Array.isArray(val)) {
    if (val.length === 0) {
      out.push(`${pad}${key}: []`);
    } else {
      out.push(`${pad}${key}:`);
      for (const v of val) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          // first key inline with "- "
          const keys = Object.keys(v);
          if (keys.length === 0) {
            out.push(`${pad}- {}`);
            continue;
          }
          out.push(`${pad}- ${keys[0]}: ${formatScalar(v[keys[0]])}`);
          for (let i = 1; i < keys.length; i++) {
            emitKv(out, keys[i], v[keys[i]], indent + 2);
          }
        } else {
          out.push(`${pad}- ${formatScalar(v)}`);
        }
      }
    }
  } else if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length === 0) {
      out.push(`${pad}${key}: {}`);
    } else {
      out.push(`${pad}${key}:`);
      for (const k of keys) {
        emitKv(out, k, val[k], indent + 2);
      }
    }
  } else {
    out.push(`${pad}${key}: ${formatScalar(val)}`);
  }
}

function formatScalar(v) {
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return quoteIfNeeded(v);
}

// ---------- handlers ----------

async function handleSaveDialogue(slug, body) {
  const file = join(DIALOGUES_DIR, `${safeSlug(slug)}.yaml`);
  await fs.mkdir(DIALOGUES_DIR, { recursive: true });
  const yaml = dumpDialogue(body);
  await fs.writeFile(file, yaml, 'utf8');
  return { ok: true, path: file, bytes: yaml.length };
}

async function handleSaveEntry(slug, body) {
  const file = join(ENTRIES_DIR, `${safeSlug(slug)}.md`);
  const fm = body?.frontmatter ?? {};
  const yaml = dumpFrontmatter(fm);
  await fs.writeFile(file, `---\n${yaml}---\n`, 'utf8');
  return { ok: true, path: file };
}

async function handleNewEntry(body) {
  const slug = safeSlug(body?.slug ?? '');
  const fm = body?.frontmatter ?? {};
  const utterances = body?.utterances ?? [];
  await fs.mkdir(ENTRIES_DIR, { recursive: true });
  await fs.mkdir(DIALOGUES_DIR, { recursive: true });
  const mdPath = join(ENTRIES_DIR, `${slug}.md`);
  const ymlPath = join(DIALOGUES_DIR, `${slug}.yaml`);
  // Refuse to overwrite an existing entry — caller must explicitly delete first.
  for (const p of [mdPath, ymlPath]) {
    try { await fs.access(p); throw new Error(`already exists: ${p}`); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  await fs.writeFile(mdPath, `---\n${dumpFrontmatter(fm)}---\n`, 'utf8');
  await fs.writeFile(ymlPath, dumpDialogue({ utterances }), 'utf8');
  return { ok: true, slug, mdPath, ymlPath };
}

async function handleDelete(slug) {
  const s = safeSlug(slug);
  const mdPath = join(ENTRIES_DIR, `${s}.md`);
  const ymlPath = join(DIALOGUES_DIR, `${s}.yaml`);
  const removed = [];
  for (const p of [mdPath, ymlPath]) {
    try { await fs.unlink(p); removed.push(p); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return { ok: true, removed };
}

// ---------- vite plugin ----------

export function devEditServer() {
  return {
    name: 'manzai-edit-server',
    apply: 'serve', // dev-only — never runs during `astro build`
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/dev/')) return next();

        const send = (status, json) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(json));
        };

        try {
          const u = new URL(url, 'http://localhost');
          const path = u.pathname.replace(/^\/api\/dev\//, '');
          // path like:  dialogue/<slug>  or  entry/<slug>  or  entry/new
          const [resource, ...rest] = path.split('/');
          const slug = decodeURIComponent(rest.join('/'));

          if (resource === 'dialogue' && req.method === 'POST') {
            const body = await readJsonBody(req);
            return send(200, await handleSaveDialogue(slug, body));
          }
          if (resource === 'entry' && slug === 'new' && req.method === 'POST') {
            const body = await readJsonBody(req);
            return send(200, await handleNewEntry(body));
          }
          if (resource === 'entry' && req.method === 'POST') {
            const body = await readJsonBody(req);
            return send(200, await handleSaveEntry(slug, body));
          }
          if (resource === 'entry' && req.method === 'DELETE') {
            return send(200, await handleDelete(slug));
          }

          send(404, { error: 'unknown route' });
        } catch (e) {
          server.config.logger.error(`[edit-server] ${e?.stack || e}`);
          send(500, { error: String(e?.message || e) });
        }
      });
    },
  };
}
