---
title: flake templates
description: use `self` so your flake can expose templates from its own tree
tags: [nixos, flakes]
date: 2025-03-29
---

if your flake exports templates, `self` is the part that points back at the current flake. that is why the template import uses `self` instead of a hard-coded path.

```nix
templates = import "${self}/templates" { inherit self; };
```

then you can initialize from that flake with:

```bash
nix flake init -t self#templates.<name-of-template>
```

that copies the selected template into the current directory.
