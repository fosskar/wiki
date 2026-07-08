import { describe, expect, it } from "vitest";
import { postHref, postSlug, published } from "./posts";

const post = (id: string, date: string, draft = false) => ({
  id,
  data: { draft, date: new Date(date) },
});

describe("published", () => {
  it("drops drafts and sorts the rest newest first", () => {
    const posts = [
      post("old.md", "2024-01-01"),
      post("future-draft.md", "2026-12-31", true),
      post("new.md", "2025-06-15"),
      post("mid.md", "2024-08-20"),
    ];
    expect(published(posts).map((p) => p.id)).toEqual([
      "new.md",
      "mid.md",
      "old.md",
    ]);
  });
});

describe("post urls", () => {
  it("postSlug strips only a trailing .md, keeping the path", () => {
    expect(postSlug("hello-world.md")).toBe("hello-world");
    expect(postSlug("2024/deep/post.md")).toBe("2024/deep/post");
    expect(postSlug("extensionless")).toBe("extensionless");
  });

  it("postHref routes under /blog/ with a trailing slash", () => {
    expect(postHref("hello-world.md")).toBe("/blog/hello-world/");
  });
});
