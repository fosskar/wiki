# wiki

personal knowledge base built with [quartz](https://quartz.jzhao.xyz/).

## dev

```bash
nix develop
wiki serve   # live preview at localhost:8080
wiki build   # static site to public/
```

## update quartz

```bash
nix-update --flake --version-regex 'v(4\.\d+\.\d+)' default
```
