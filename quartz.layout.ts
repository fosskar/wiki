import { PageLayout, SharedLayout } from "./quartz/cfg";
import * as Component from "./quartz/components";

const socialLinks = {
  github: "https://github.com/fosskar",
  codeberg: "https://codeberg.org/fosskar",
  radicle: "https://radicle.fosskar.eu",
  matrix: "https://matrix.to/#/@fosscar:matrix.org",
};

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({ links: socialLinks }),
};

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs({ rootName: "home" }),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
      title: "topics",
      folderClickBehavior: "collapse",
      folderDefaultState: "open",
      useSavedState: false,
    }),
  ],
  right: [
    Component.Footer({ links: socialLinks }),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.DesktopOnly(Component.Backlinks()),
  ],
};

export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs({ rootName: "home" }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
      title: "topics",
      folderClickBehavior: "collapse",
      folderDefaultState: "open",
      useSavedState: false,
    }),
  ],
  right: [Component.Footer({ links: socialLinks })],
};
