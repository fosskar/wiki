# domain glossary

terms used by the site code (`site/src/lib/`, pages, config). code and prose
should use these names, not synonyms.

- **note** — one markdown file in `wiki/`. its **slug** is its basename
  (obsidian shortest-path style), unique across the whole vault; notes route
  flat at `/wiki/<slug>/` regardless of directory. identity rules live in
  `site/src/lib/notes.ts`.
- **section** — a top-level directory of `wiki/` (nixos, kubernetes, …).
  sections are not pages; they render as anchored cards on the wiki index,
  linked as `/wiki/#<section>`. descriptions live in `SECTIONS` in
  `notes.ts` so folders need no `index.md`.
- **wikilink** — an obsidian `[[target|alias]]` link in any content
  collection. targets resolve to note slugs; unresolved targets fail the
  build at config load (`validateWikiLinks`). the vault-root `wiki/index.md`
  is the obsidian home page, not a site page, and is exempt.
- **post** — one markdown file in `blog/`. **published** means not draft,
  listed newest first; a post's url is its id minus `.md` under `/blog/`.
  publication rules live in `site/src/lib/posts.ts`.
- **project** — one markdown file in `projects/`, rendered as a card on the
  projects page, ordered by frontmatter `order`.
