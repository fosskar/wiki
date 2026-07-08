import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";

// note identity: a note's slug is its basename (obsidian shortest-path
// style), unique across the vault; notes route flat at /wiki/<slug>/.
// this module is the only place that rule lives — the wikilink resolver
// in astro.config.ts and the wiki/home pages are adapters over it.

export function slugOf(id: string): string {
  return id.split("/").pop()!.replace(/\.md$/, "");
}

export function sectionOf(id: string): string {
  return id.split("/")[0]!;
}

export function noteHref(id: string): string {
  return `/wiki/${slugOf(id)}/`;
}

/** sections render as anchored cards on the wiki index */
export function sectionHref(section: string): string {
  return `/wiki/#${section}`;
}

// section metadata lives here so folders need no index.md
export const SECTIONS: Record<string, string> = {
  nixos: "NixOS-specific system, security, and troubleshooting notes",
  kubernetes:
    "talos, cilium, cluster api, networking, gitops, and local development notes",
  homelab: "proxmox, networking, identity, storage, and infrastructure notes",
  security:
    "hardware tokens, authentication, encryption, and key management notes",
};

/** described sections first (in SECTIONS order), the rest alphabetical */
export function orderedSections(found: Iterable<string>): string[] {
  const present = new Set(found);
  return [
    ...Object.keys(SECTIONS).filter((s) => present.has(s)),
    ...[...present].filter((s) => !(s in SECTIONS)).sort(),
  ];
}

export function assertUniqueSlugs(ids: Iterable<string>): void {
  const seen = new Map<string, string>();
  for (const id of ids) {
    const slug = slugOf(id);
    const prev = seen.get(slug);
    if (prev) {
      throw new Error(`duplicate wiki slug "${slug}": ${prev} vs ${id}`);
    }
    seen.set(slug, id);
  }
}

export interface NoteLike {
  id: string;
  data: { title: string };
}

/** a section's notes grouped by subdirectory ("" = section root), both levels sorted */
export function groupsOf<T extends NoteLike>(
  section: string,
  all: T[],
): [string, T[]][] {
  const notes = all
    .filter((e) => e.id.startsWith(section + "/"))
    .sort((a, b) => a.data.title.localeCompare(b.data.title));
  const groups = new Map<string, T[]>();
  for (const note of notes) {
    const parts = note.id.split("/");
    const sub = parts.slice(1, -1).join("/");
    if (!groups.has(sub)) groups.set(sub, []);
    groups.get(sub)!.push(note);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/**
 * resolve an obsidian [[wikilink]] target to a note slug, or throw so the
 * build fails instead of shipping a dead link. `known` comes from
 * noteSlugIndex (config time) since astro's content layer isn't loaded yet.
 */
export function resolveWikiLink(
  name: string,
  known: ReadonlySet<string>,
): string {
  const parts = name
    .replace(/ /g, "-")
    .toLowerCase()
    .split("/")
    .filter((p) => p && p !== "..");
  const last = parts.at(-1) ?? "";
  if (last === "index") {
    throw new Error(
      `wikilink [[${name}]]: dir-index links have no route; link a note by basename`,
    );
  }
  if (!known.has(last)) {
    throw new Error(`wikilink [[${name}]]: no wiki note with slug "${last}"`);
  }
  return last;
}

/**
 * wikilink targets in a markdown document with their line numbers, skipping
 * fenced code blocks and inline code spans. target = text before the `|`
 * alias divider, exactly what remark-wiki-link hands to the page resolver.
 */
export function scanWikiLinks(
  markdown: string,
): { target: string; line: number }[] {
  const found: { target: string; line: number }[] = [];
  let fence: string | null = null;
  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const open = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (open && open[1]!.startsWith(fence)) fence = null;
      continue;
    }
    if (open) {
      fence = open[1]!;
      continue;
    }
    const prose = line.replace(/`[^`]*`/g, "");
    for (const m of prose.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) {
      found.push({ target: m[1]!, line: i + 1 });
    }
  }
  return found;
}

/**
 * resolve every wikilink in every markdown file under `dirs`; throws with
 * the full list of broken links. runs at config load, where a throw
 * actually fails the build — a throw inside the remark plugin only gets
 * logged by the glob loader, which then ships the stale cached render.
 */
export function validateWikiLinks(
  dirs: string[],
  known: ReadonlySet<string>,
): void {
  const broken: string[] = [];
  for (const dir of dirs) {
    const files = readdirSync(dir, { recursive: true, encoding: "utf8" })
      .map((p) => p.split(sep).join("/"))
      // vault-root index.md is the obsidian home page, not a site page
      .filter((p) => p.endsWith(".md") && p !== "index.md");
    for (const file of files) {
      const text = readFileSync(join(dir, file), "utf8");
      for (const { target, line } of scanWikiLinks(text)) {
        try {
          resolveWikiLink(target, known);
        } catch (e) {
          broken.push(`${join(dir, file)}:${line}: ${(e as Error).message}`);
        }
      }
    }
  }
  if (broken.length > 0) {
    throw new Error(`broken wikilinks:\n${broken.join("\n")}`);
  }
}

/** filesystem-backed slug index; also runs the collision check at config load */
export function noteSlugIndex(wikiDir: string): Set<string> {
  const ids = readdirSync(wikiDir, { recursive: true, encoding: "utf8" })
    .map((p) => p.split(sep).join("/"))
    // vault-root index.md is the obsidian home page, not a site page
    .filter((p) => p.endsWith(".md") && p !== "index.md");
  assertUniqueSlugs(ids);
  return new Set(ids.map((id) => slugOf(id).replace(/ /g, "-").toLowerCase()));
}
