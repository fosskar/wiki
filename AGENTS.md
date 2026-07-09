# Repository Guidelines

## Project Overview

Personal bliki ("half blog, half wiki") published at https://bliki.fosskar.eu. Markdown content authored in an Obsidian vault, rendered by a minimal Astro static site, built reproducibly with Nix. `CONTEXT.md` is the domain glossary (note, section, wikilink, post, project) — use its vocabulary in code and prose.

## Architecture & Data Flow

Content lives at the **repo root**, outside the app. `site/src/content.config.ts` loads three collections via glob with `base: "../<dir>"`:

- `wiki/` → notes, routed **flat** as `/wiki/<basename>/` regardless of directory depth (vault-root `wiki/index.md` is the Obsidian home page, excluded via `!index.md`)
- `blog/` → posts at `/blog/<id>/` (drafts filtered)
- `projects/` → cards on `/projects/` (single page, ordered by `order`)

Domain logic is centralized in `site/src/lib/`:

- `notes.ts` — note identity and wikilinks: `slugOf`/`noteHref` (flat routing), `noteSlugIndex()` (basename → slug, Obsidian shortest-path, unique vault-wide), `resolveWikiLink()`, `scanWikiLinks()` (skips code fences), `validateWikiLinks()`, `assertUniqueSlugs()` (collision throws naming both IDs), and the `SECTIONS` record (section descriptions + display order — vault folders need **no** per-directory `index.md`)
- `posts.ts` — publication rules: `published()` filters `draft: true` and sorts newest-first; used by home, blog index, blog routes, and RSS

Build-time validation fails fast: `astro.config.ts` calls `validateWikiLinks()` and `noteSlugIndex()` at **config load**, and `wiki/[...slug].astro`'s `getStaticPaths` calls `assertUniqueSlugs()` — broken wikilinks or duplicate basenames fail the build, never ship.

Wikilinks `[[basename|title]]` resolve via `remark-wiki-link` (configured in `site/astro.config.ts`) to `/wiki/<basename>/`.

## Key Directories

- `wiki/` — Obsidian vault; topic dirs `nixos/` (+ `nixos/security/`), `kubernetes/`, `homelab/`, `security/yubikey/`, `gaming/`
- `blog/`, `projects/` — content collections
- `site/` — Astro app: `src/pages/`, `src/lib/` (domain logic + tests), `src/components/` (`ArticleHead.astro`, `EntryCard.astro`, `Social.astro`), `src/layouts/Layout.astro`, `src/content.config.ts`, `astro.config.ts`
- `nix/` — flake modules: `package.nix` (site build), `devshell.nix`, `effects.nix` (Hercules CI), `treefmt.nix`, `checks.nix`

## Development Commands

```bash
nix develop                 # devshell: node, node_modules symlinked from nix store
cd site && npm run dev      # live preview at localhost:4321
cd site && npm run build    # static build to site/dist/
cd site && npm test         # vitest run (lib unit tests)
nix build                   # reproducible build (result/ = dist)
nix fmt                     # treefmt: nixfmt + prettier
nix flake check             # builds packages + devshells (does NOT run vitest)
```

Dependency updates: `npm update --package-lock-only` (node_modules is read-only; see README.md), then re-enter the devshell.

## Code Conventions & Common Patterns

Wiki note conventions (apply when writing or editing notes under `wiki/`):

- lowercase terse prose, proper nouns keep case (NixOS, OPNsense, Steam); reason-first openings — why this shape, not a config dump
- `type` implies shape: `guide` = context → steps → verify; `troubleshooting` = symptom → cause → fix; `reference` = annotated list
- every guide ends with `## verify`: one command plus the expected result
- anchor every config block with a comment naming its file/chart/module/UI path; `(this setup)` marks concrete lab values; pin versions only when actually known and link the upstream issue for workarounds
- placeholders use `<angle-brackets>`; Steam's literal `%command%` is not a placeholder
- cross-link related notes in a reciprocal `## related` footer of `- [[basename|title]]` bullets; external links go in `## references`
- `date` means last verified, not created; bump it only when a note is actually re-tested
- headings h2/h3 only (feeds the TOC depth filter); per-note TOC opt-out via `enableToc: false`

Site code:

- TypeScript strict (`astro/tsconfigs/strict`); all config is `.ts` including `astro.config.ts`
- domain logic belongs in `site/src/lib/` with colocated vitest tests (`notes.test.ts`, `posts.test.ts`) — pages stay thin, calling `published()`, `noteHref()`, etc. rather than inlining rules
- shared markup goes in `src/components/` (`ArticleHead` for article headers, `EntryCard` for listings) — don't re-inline card/header markup in pages
- styling is hand-written CSS: global theme (CSS variables, dark default, light via `prefers-color-scheme`) in `Layout.astro` `<style is:global>`, page/component rules in scoped `<style>` blocks — no framework, no integrations beyond sitemap + RSS
- frontmatter schemas are zod in `content.config.ts`; extend the schema before using a new field

## Important Files

- `site/src/content.config.ts` — collection loaders + schemas (source of truth for frontmatter)
- `site/src/lib/notes.ts` — slug/wikilink/section logic incl. `SECTIONS`; touch this for anything routing- or link-related
- `site/src/lib/posts.ts` — blog publication rules
- `site/astro.config.ts` — site URL, wikilink resolver, shiki dual themes, cache relocation, build-time wikilink validation
- `site/src/layouts/Layout.astro` — nav, global CSS theme
- `CONTEXT.md` — domain glossary
- `nix/package.nix` — **trap**: content dirs are whitelisted in a `lib.fileset` union; a new repo-root content dir MUST be added there or `nix build` silently drops it
- `nix/effects.nix` — Hercules CI: daily `update-flake-inputs` effect (05:00), commits as `fosskar[bot]` via GitToken app secret; no deploy effect in this repo

## Runtime/Tooling Preferences

- **npm** with committed `package-lock.json`; nix builds are hash-free via `pkgs.importNpmLock` (no npmDeps hash to refresh)
- node from the devshell (nodejs 24 — npm ≥ 11.10 enforces `site/.npmrc` `min-release-age=3`, a 3-day supply-chain cooldown when changing deps); `package.json` engines require node ≥ 22.12
- `site/node_modules` is a **read-only nix store symlink** — never `npm install` into it, and never let it get git-tracked (flake source then ships a broken symlink and astro prerender fails); astro/vite caches are relocated to `site/.cache/` for this reason
- formatting via `nix fmt` (treefmt: nixfmt + prettier with `embeddedLanguageFormatting = "off"` so markdown code fences stay untouched); markdownlint-cli2 and marksman available in the devshell
- VCS is plain git (`main`, origin = github.com/fosskar/wiki); commit messages are `<area>: <description>` lowercase (`site:`, `wiki:`, `nix:`, `docs:`); no GitHub Actions — CI is Hercules effects only

## Testing & QA

- `cd site && npm test` — vitest unit tests for `src/lib/` (wikilink resolution, slug collision, draft filtering); run after touching `lib/`; **not** wired into `nix flake check`
- `nix flake check` / `nix build` — the build fails on schema violations, duplicate wiki slugs, unresolved wikilinks, and broken frontmatter
- after content edits, `npm run build` in `site/` is the fast check; inspect `site/dist/` output for rendered wikilinks when touching `## related` footers
- nix edits: run `nix fmt` before committing
