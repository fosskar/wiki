# Repository Guidelines

## Project Overview

Personal bliki ("half blog, half wiki") published at https://bliki.fosskar.eu. Markdown content authored in an Obsidian vault, rendered by a minimal Astro static site, built reproducibly with Nix.

## Architecture & Data Flow

Content lives at the **repo root**, outside the app. `site/src/content.config.ts` loads three collections via glob with `base: "../<dir>"`:

- `wiki/` → notes, routed **flat** as `/wiki/<basename>/` (vault-root `wiki/index.md` is the Obsidian home page and excluded via `!index.md`)
- `blog/` → posts at `/blog/<id>/` (drafts filtered)
- `projects/` → cards on `/projects/` (single page, ordered by `order`)

Wiki flow specifics:

- `site/src/pages/wiki/[...slug].astro` — `getStaticPaths` throws at build time on duplicate note basenames (cross-section collision guard); TOC from h2–h3 unless `enableToc: false`; breadcrumbs anchor to `/wiki/#<section>`.
- `site/src/pages/wiki/index.astro` — section descriptions/order hardcoded in a `SECTIONS` record; vault folders need **no** per-directory `index.md`; notes grouped by subdirectory.
- Wikilinks `[[basename|title]]` resolve via `remark-wiki-link` (configured in `site/astro.config.mjs`): Obsidian shortest-path, basenames must be unique vault-wide, href `/wiki/<basename>/`.

## Key Directories

- `wiki/` — Obsidian vault; topic dirs `nixos/` (+ `nixos/security/`), `kubernetes/`, `homelab/`, `security/yubikey/`, `gaming/`
- `blog/`, `projects/` — content collections
- `site/` — Astro app (`src/pages/`, `src/layouts/Layout.astro`, `src/content.config.ts`, `astro.config.mjs`)
- `nix/` — flake modules: `package.nix` (site build), `devshell.nix`, `effects.nix` (Hercules CI), `treefmt.nix`, `checks.nix`

## Development Commands

```bash
nix develop                 # devshell: node, node_modules symlinked from nix store
cd site && npm run dev      # live preview at localhost:4321
cd site && npm run build    # static build to site/dist/
nix build                   # reproducible build (result/ = dist)
nix fmt                     # treefmt: nixfmt + prettier
nix flake check             # builds packages + devshells (no separate test suite)
```

## Code Conventions & Common Patterns

Wiki note conventions (apply when writing or editing notes under `wiki/`):

- lowercase terse prose, proper nouns keep case (NixOS, OPNsense, Steam); reason-first openings — why this shape, not a config dump
- `type` implies shape: `guide` = context → steps → verify; `troubleshooting` = symptom → cause → fix; `reference` = annotated list
- every guide ends with `## verify`: one command plus the expected result
- anchor every config block with a comment naming its file/chart/module/UI path; `(this setup)` marks concrete lab values; pin versions only when actually known and link the upstream issue for workarounds
- placeholders use `<angle-brackets>`; Steam's literal `%command%` is not a placeholder
- cross-link related notes in a reciprocal `## related` footer of `- [[basename|title]]` bullets
- `date` means last verified, not created; bump it only when a note is actually re-tested
- headings h2/h3 only (feeds the TOC depth filter)

Site code:

- TypeScript strict (`astro/tsconfigs/strict`); the one `.mjs` (`astro.config.mjs`) uses `// @ts-check` + JSDoc casts
- styling is hand-written CSS: global theme (CSS variables, dark default) in `Layout.astro` `<style is:global>`, page-specific rules in scoped `<style>` blocks — no framework, no integrations beyond sitemap
- frontmatter schemas are zod in `content.config.ts`; extend the schema before using a new field

## Important Files

- `site/src/content.config.ts` — collection loaders + schemas (source of truth for frontmatter)
- `site/astro.config.mjs` — site URL, wikilink resolver, shiki dual themes, cache relocation
- `site/src/layouts/Layout.astro` — nav, global CSS theme
- `nix/package.nix` — **trap**: content dirs are whitelisted in a `lib.fileset`; a new repo-root content dir MUST be added there or `nix build` silently drops it
- `nix/effects.nix` — Hercules CI: daily `update-flake-inputs` effect (05:00), commits as `fosskar[bot]` via GitToken app secret; no deploy effect in this repo

## Runtime/Tooling Preferences

- **npm** with committed `package-lock.json`; nix builds are hash-free via `pkgs.importNpmLock` (no npmDeps hash to refresh)
- node from the devshell (nodejs 24 — npm ≥ 11.10 enforces `site/.npmrc` `min-release-age=3`, a 3-day supply-chain cooldown when changing deps)
- `site/node_modules` is a **read-only nix store symlink** — never `npm install` into it; astro/vite caches are relocated to `site/.cache/` for this reason
- formatting via `nix fmt` (treefmt: nixfmt + prettier); markdownlint-cli2 and marksman available in the devshell

## Testing & QA

No test suite. Verification is build-based:

- `nix flake check` / `nix build` — the build fails on schema violations, duplicate wiki slugs, and broken frontmatter
- after content edits, `npm run build` in `site/` is the fast check; inspect `site/dist/` output for rendered wikilinks when touching `## related` footers
- nix edits: run `nix fmt` before committing
