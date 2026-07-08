import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const noteSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  type: z.string().default("note"),
  enableToc: z.boolean().optional(),
  draft: z.boolean().default(false),
});

const wiki = defineCollection({
  loader: glob({
    base: "../wiki",
    // vault-root index.md is the obsidian home page, not a site page
    pattern: ["**/*.md", "!index.md"],
  }),
  schema: noteSchema,
});

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string().url().optional(),
    repo: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

export const collections = { wiki, blog, projects };
