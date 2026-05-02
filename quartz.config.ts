import { QuartzConfig } from "./quartz/cfg";
import * as Plugin from "./quartz/plugins";

const config: QuartzConfig = {
  configuration: {
    pageTitle: "fosskar's bliki",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-GB",
    baseUrl: "bliki.fosskar.eu",
    ignorePatterns: [
      "private",
      "templates",
      ".obsidian",
      ".git",
      ".jj",
      "node_modules",
      ".direnv",
      ".smart-env",
      "README.md",
    ],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Inter",
        body: "Inter",
        code: "Commit Mono",
      },
      colors: {
        lightMode: {
          light: "#ece8e1",
          lightgray: "#d8d2c8",
          gray: "#9ea5a9",
          darkgray: "#5b5f63",
          dark: "#1f1f1f",
          secondary: "#264d2a",
          tertiary: "#2f6234",
          highlight: "rgba(38, 77, 42, 0.10)",
          textHighlight: "#7aa37a55",
        },
        darkMode: {
          light: "#202020",
          lightgray: "#303030",
          gray: "#616161",
          darkgray: "#CCCCCC",
          dark: "#CCCCCC",
          secondary: "#1ABC9C",
          tertiary: "#16A085",
          highlight: "rgba(22, 160, 133, 0.15)",
          textHighlight: "#16A08588",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
};

export default config;
