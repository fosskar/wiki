import { defineConfig } from "astro/config";
import wikiLinkPlugin from "remark-wiki-link";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  noteSlugIndex,
  resolveWikiLink,
  validateWikiLinks,
} from "./src/lib/notes";

// note identity + wikilink resolution live in src/lib/notes.ts; the content
// layer isn't loaded yet at config time, so the slug index comes from the
// filesystem. validation runs here because a config-load throw is the only
// reliable way to fail the build (the remark plugin's throw only gets
// logged by the glob loader, which then ships a stale cached render).
const contentRoot = fileURLToPath(new URL("..", import.meta.url));
const knownSlugs = noteSlugIndex(join(contentRoot, "wiki"));
validateWikiLinks(
  ["wiki", "blog", "projects"].map((d) => join(contentRoot, d)),
  knownSlugs,
);

export default defineConfig({
  site: "https://bliki.fosskar.eu",
  integrations: [sitemap()],
  // node_modules is a read-only nix store symlink in the dev shell;
  // keep caches (default node_modules/.astro, node_modules/.vite) outside it
  cacheDir: "./.cache/astro",
  vite: { cacheDir: "./.cache/vite" },
  markdown: {
    remarkPlugins: [
      [
        wikiLinkPlugin,
        {
          aliasDivider: "|",
          pageResolver: (name: string) => [resolveWikiLink(name, knownSlugs)],
          hrefTemplate: (permalink: string) => `/wiki/${permalink}/`,
          wikiLinkClassName: "wikilink",
          newClassName: "wikilink",
        },
      ],
    ],
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
    },
  },
});
