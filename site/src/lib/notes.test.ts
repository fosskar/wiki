import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  SECTIONS,
  assertUniqueSlugs,
  groupsOf,
  noteHref,
  noteSlugIndex,
  orderedSections,
  resolveWikiLink,
  scanWikiLinks,
  sectionHref,
  sectionOf,
  slugOf,
  validateWikiLinks,
} from "./notes";

// tmp-dir fixture trees for the fs-backed functions, torn down per test
const tmpdirs: string[] = [];
afterEach(() => {
  for (const dir of tmpdirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function makeTree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "wiki-notes-test-"));
  tmpdirs.push(root);
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  return root;
}

describe("note identity", () => {
  it("slugOf is the basename, minus a trailing .md", () => {
    expect(slugOf("nixos/audio/pipewire")).toBe("pipewire");
    expect(slugOf("homelab/proxmox.md")).toBe("proxmox");
    expect(slugOf("standalone")).toBe("standalone");
  });

  it("sectionOf is the first path segment", () => {
    expect(sectionOf("nixos/audio/pipewire")).toBe("nixos");
    expect(sectionOf("security/yubikey.md")).toBe("security");
  });

  it("notes route flat under /wiki/ regardless of directory depth", () => {
    expect(noteHref("nixos/audio/pipewire")).toBe("/wiki/pipewire/");
  });

  it("sections link to anchors on the wiki index", () => {
    expect(sectionHref("nixos")).toBe("/wiki/#nixos");
  });
});

describe("orderedSections", () => {
  // derived from the live record so tests survive config edits
  const described = Object.keys(SECTIONS);

  it("puts described sections first in SECTIONS order, the rest alphabetical", () => {
    const found = ["zzz-extra", ...[...described].reverse(), "aaa-extra"];
    expect(orderedSections(found)).toEqual([
      ...described,
      "aaa-extra",
      "zzz-extra",
    ]);
  });

  it("lists only the described sections actually present", () => {
    const some = [described.at(-1)!, described[0]!];
    expect(orderedSections(some)).toEqual([described[0], described.at(-1)]);
  });

  it("deduplicates", () => {
    expect(orderedSections(["misc", "misc"])).toEqual(["misc"]);
  });
});

describe("assertUniqueSlugs", () => {
  it("accepts ids whose basenames differ", () => {
    expect(() =>
      assertUniqueSlugs(["nixos/zfs.md", "homelab/zfs-backup.md"]),
    ).not.toThrow();
  });

  it("names the shared slug and both colliding ids", () => {
    expect(() =>
      assertUniqueSlugs(["nixos/zfs.md", "homelab/storage/zfs.md"]),
    ).toThrow(/"zfs".*nixos\/zfs\.md.*homelab\/storage\/zfs\.md/);
  });
});

describe("groupsOf", () => {
  const note = (id: string, title: string) => ({ id, data: { title } });
  // titles deliberately invert id order to prove the sort key is the title
  const all = [
    note("nixos/audio/pipewire.md", "audio graph"),
    note("nixos/zfs.md", "storage pools"),
    note("nixos/audio/usb/dac.md", "usb dac"),
    note("nixos/audio/alsa.md", "z fallback"),
    note("nixos/boot.md", "the boot loader"),
    note("nix/flakes.md", "flakes"),
    note("kubernetes/cilium.md", "cilium"),
  ];

  it("groups a section's notes by subdirectory path, both levels sorted", () => {
    const got = groupsOf("nixos", all).map(([sub, notes]) => [
      sub,
      notes.map((n) => n.id),
    ]);
    expect(got).toEqual([
      ["", ["nixos/zfs.md", "nixos/boot.md"]],
      ["audio", ["nixos/audio/pipewire.md", "nixos/audio/alsa.md"]],
      ["audio/usb", ["nixos/audio/usb/dac.md"]],
    ]);
  });

  it("does not leak a section whose name prefixes another", () => {
    expect(groupsOf("nix", all)).toEqual([
      ["", [note("nix/flakes.md", "flakes")]],
    ]);
  });
});

describe("scanWikiLinks", () => {
  it("finds targets with 1-based lines, several per line, alias stripped", () => {
    const md = [
      "intro [[Alpha]] then [[Beta|the b note]]",
      "",
      "[[Gamma Note]]",
    ].join("\n");
    expect(scanWikiLinks(md)).toEqual([
      { target: "Alpha", line: 1 },
      { target: "Beta", line: 1 },
      { target: "Gamma Note", line: 3 },
    ]);
  });

  it("skips links inside backtick fences", () => {
    const md = ["[[before]]", "```", "[[inside]]", "```", "[[after]]"].join(
      "\n",
    );
    expect(scanWikiLinks(md)).toEqual([
      { target: "before", line: 1 },
      { target: "after", line: 5 },
    ]);
  });

  it("skips links inside tilde fences, info string allowed", () => {
    const md = ["~~~text", "[[inside]]", "~~~", "[[after]]"].join("\n");
    expect(scanWikiLinks(md)).toEqual([{ target: "after", line: 4 }]);
  });

  it("a longer fence closes a shorter opener", () => {
    const md = ["```", "[[hidden]]", "````", "[[after]]"].join("\n");
    expect(scanWikiLinks(md)).toEqual([{ target: "after", line: 4 }]);
  });

  it("a shorter or different-marker fence line does not close the block", () => {
    const md = [
      "````",
      "```",
      "[[still hidden]]",
      "~~~~",
      "[[also hidden]]",
      "````",
      "[[after]]",
    ].join("\n");
    expect(scanWikiLinks(md)).toEqual([{ target: "after", line: 7 }]);
  });

  it("a fence indented up to three spaces still opens", () => {
    const md = ["   ```", "[[hidden]]", "```", "[[after]]"].join("\n");
    expect(scanWikiLinks(md)).toEqual([{ target: "after", line: 4 }]);
  });

  it("ignores inline code spans but not the rest of the line", () => {
    const md = "see `[[not a link]]` and [[real]]";
    expect(scanWikiLinks(md)).toEqual([{ target: "real", line: 1 }]);
  });
});

describe("resolveWikiLink", () => {
  const known: ReadonlySet<string> = new Set(["my-note", "pipewire"]);

  it("resolves a plain known name", () => {
    expect(resolveWikiLink("pipewire", known)).toBe("pipewire");
  });

  it("normalizes spaces and case, resolving by basename", () => {
    expect(resolveWikiLink("Sub Dir/My Note", known)).toBe("my-note");
  });

  it("drops empty and .. path segments", () => {
    expect(resolveWikiLink("../secrets//My Note", known)).toBe("my-note");
  });

  it("rejects dir-index links even when routed through a path", () => {
    expect(() => resolveWikiLink("nixos/index", known)).toThrow(
      /\[\[nixos\/index\]\].*dir-index/,
    );
    expect(() => resolveWikiLink("Index", known)).toThrow(/dir-index/);
  });

  it("rejects unknown slugs, naming the original link text", () => {
    expect(() => resolveWikiLink("Missing Note", known)).toThrow(
      /\[\[Missing Note\]\].*"missing-note"/,
    );
  });
});

describe("noteSlugIndex", () => {
  it("indexes normalized basenames recursively, excluding only the vault-root index.md", () => {
    const root = makeTree({
      "index.md": "# obsidian home, not a site page",
      "nixos/ZFS Pools.md": "",
      "nixos/audio/pipewire.md": "",
      "homelab/index.md": "",
      "nixos/scratch.txt": "not markdown",
    });
    // homelab/index.md counts; if the root index.md were included too,
    // the collision check would throw instead of returning this set
    expect(noteSlugIndex(root)).toEqual(
      new Set(["zfs-pools", "pipewire", "index"]),
    );
  });

  it("fails on colliding basenames across directories", () => {
    const root = makeTree({
      "nixos/zfs.md": "",
      "homelab/storage/zfs.md": "",
    });
    expect(() => noteSlugIndex(root)).toThrow(/"zfs"/);
  });
});

describe("validateWikiLinks", () => {
  const known: ReadonlySet<string> = new Set(["pipewire", "zfs-pools"]);

  it("passes a tree whose links all resolve", () => {
    const root = makeTree({
      "nixos/audio.md": "see [[pipewire]] and [[ZFS Pools|pools]]",
    });
    expect(() => validateWikiLinks([root], known)).not.toThrow();
  });

  it("lists every broken link across dirs as path:line", () => {
    const rootA = makeTree({
      "nixos/a.md": ["fine [[pipewire]]", "", "bad [[Missing One]]"].join("\n"),
    });
    const rootB = makeTree({
      "b.md": "bad [[missing-two]]",
    });

    let err: Error | undefined;
    try {
      validateWikiLinks([rootA, rootB], known);
    } catch (e) {
      err = e as Error;
    }
    expect(err).toBeDefined();
    expect(err!.message).toContain(`${join(rootA, "nixos/a.md")}:3:`);
    expect(err!.message).toContain(`${join(rootB, "b.md")}:1:`);
    expect(err!.message).toContain("[[Missing One]]");
    expect(err!.message).toContain("[[missing-two]]");
  });

  it("skips the vault-root index.md", () => {
    const root = makeTree({ "index.md": "[[nowhere]]" });
    expect(() => validateWikiLinks([root], known)).not.toThrow();
  });
});
