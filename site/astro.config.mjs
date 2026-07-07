// @ts-check
import { defineConfig } from "astro/config";
import wikiLinkPlugin from "remark-wiki-link";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://bliki.fosskar.eu",
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [
      [
        wikiLinkPlugin,
        {
          aliasDivider: "|",
          // note basenames are unique across the vault (Obsidian shortest-path
          // style); dir links like [[../nixos/security/index]] route to the
          // dir index page at /wiki/<dir-path>/
          pageResolver: (/** @type {string} */ name) => {
            const parts = name
              .replace(/ /g, "-")
              .toLowerCase()
              .split("/")
              .filter((p) => p && p !== "..");
            if (parts.at(-1) === "index") {
              return [parts.slice(0, -1).join("/")];
            }
            return [parts.at(-1) ?? name];
          },
          hrefTemplate: (/** @type {string} */ permalink) =>
            `/wiki/${permalink}/`,
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
