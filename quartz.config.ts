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
    baseUrl: "localhost",
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
          light: "#f3f1ed",
          lightgray: "#e3dfd8",
          gray: "#a8b0b5",
          darkgray: "#5f6368",
          dark: "#1f1f1f",
          secondary: "#0f5c52",
          tertiary: "#0a7a6c",
          highlight: "rgba(15, 92, 82, 0.14)",
          textHighlight: "#6fcfbd66",
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
