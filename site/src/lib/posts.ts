// blog publication rule: drafts never ship, listings run newest first,
// and a post's url is its id minus the .md extension under /blog/.
// home, blog index, blog route, and rss all consume this interface.

export interface PostLike {
  id: string;
  data: { draft: boolean; date: Date };
}

/** drafts removed, newest first */
export function published<T extends PostLike>(posts: T[]): T[] {
  return posts
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function postSlug(id: string): string {
  return id.replace(/\.md$/, "");
}

export function postHref(id: string): string {
  return `/blog/${postSlug(id)}/`;
}
