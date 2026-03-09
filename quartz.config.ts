import { QuartzConfig } from "./quartz/cfg";
import * as Plugin from "./quartz/plugins";

const config: QuartzConfig = {
  configuration: {
    pageTitle: "wiki",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
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
    ],
    defaultDateType: "modified",
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
          light: "#FAFAFA",
          lightgray: "#EEEEEE",
          gray: "#B0BEC5",
          darkgray: "#616161",
          dark: "#181818",
          secondary: "#0E6655",
          tertiary: "#16A085",
          highlight: "rgba(163, 228, 215, 0.2)",
          textHighlight: "#A3E4D788",
        },
        darkMode: {
          light: "#181818",
          lightgray: "#282828",
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
        priority: ["git", "filesystem"],
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
