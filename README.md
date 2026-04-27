# manzai-archive / web

Static site (Astro + Tailwind + Pagefind) for the manzai script archive.

- Live: https://manzai-archive.github.io/web/
- Pipeline (transcription): https://github.com/manzai-archive/pipeline

## Develop

```bash
pnpm install
pnpm dev
```

## Add an entry

Drop a markdown file into [`src/content/manzai/`](src/content/manzai/).
The schema is enforced in [`src/content.config.ts`](src/content.config.ts).

The pipeline writes draft files with the right frontmatter — review them,
fill in real speaker names under `speakers:`, flip `status: draft` →
`reviewed`, and PR.

## Build

```bash
pnpm build
```

Outputs static site to `dist/`, then runs Pagefind to generate the
search index. GH Pages deploys via `.github/workflows/deploy.yml`.

## Takedown

See [NOTICE.md](NOTICE.md). Confirmed takedowns are added to
[`blocklist.yaml`](blocklist.yaml) and excluded from the next build.
