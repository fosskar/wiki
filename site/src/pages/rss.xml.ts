import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { published, postHref } from "../lib/posts";

export async function GET(context: APIContext) {
  const posts = published(await getCollection("blog"));
  return rss({
    title: "fosskar",
    description: "homelab, nixos, kubernetes — notes and projects",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postHref(post.id),
    })),
  });
}
