---
title: expose flake templates with self
description: use self so a flake can expose templates from its own repository tree
date: 2025-03-29
type: note
---

if your flake exports templates, `self` is the part that points back at the current flake. that is why the template import uses `self` instead of a hard-coded path.

```nix
# flake.nix (outputs)
templates = import "${self}/templates" { inherit self; };
```

`self` only exists inside `flake.nix`; on the command line, refer to the flake by its flake reference:

```bash
nix flake init -t <flake-ref>#<name-of-template>
```

that copies the selected template into the current directory.
