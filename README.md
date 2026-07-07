# wiki

personal site built with [astro](https://astro.build): blog, wiki, and projects. wiki notes live as plain markdown in `wiki/` (obsidian vault at repo root), the astro project in `site/`, nix modules in `nix/`.

## dev

```bash
nix develop
cd site && npm run dev     # live preview at localhost:4321
cd site && npm run build   # static site to site/dist/
nix build                  # reproducible site build
```

## update dependencies

```bash
cd site && npm update
# then refresh npmDeps hash in flake.nix:
nix build 2>&1 | grep got:
```
