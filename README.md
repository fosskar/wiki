# personal wiki - NixOS & gaming

welcome to my personal knowledge base focused on NixOS configuration, gaming setups, and system administration. this wiki is designed to work seamlessly with Obsidian.

## quick navigation

### 🏠 [nixos setup](nixos/README.md)

- [installation guide](nixos/installation/README.md)
- [configuration](nixos/configuration/README.md)
- [security](nixos/security/README.md)

### 🎮 [gaming](nixos/gaming/README.md)

- [CS2 configuration](nixos/gaming/cs2/README.md)
- [Hyprland gaming](nixos/gaming/hyprland/README.md)
- [network optimization](nixos/gaming/network/README.md)

### 🔧 [troubleshooting](nixos/troubleshooting/README.md)

- [bootloader issues](nixos/troubleshooting/re-installing-the-bootloader.md)
- [common problems](nixos/troubleshooting/README.md)

### ☸️ [kubernetes](nixos/kubernetes/README.md)

- [minikube setup](nixos/kubernetes/minikube.md)

## obsidian integration

this wiki is optimized for Obsidian with:

- YAML frontmatter for metadata
- internal links using `[[Page Name]]` format
- tag support for categorization
- mermaid diagrams support
- code block syntax highlighting

## structure

```markdown
# file naming convention

- use kebab-case for file names
- README.md files in each directory for navigation
- index pages for major topics

# frontmatter template

---

title: "page title"
description: "brief description"
tags: [nixos, gaming, configuration]
date: 2024-01-01

---

# linking

- use [[internal links]] for cross-references
- use [external links](https://example.com) for web resources
```bash

## getting started

1. **new to NixOS?** start with [[nixos/installation/README|installation guide]]
2. **gaming setup?** check [[nixos/gaming/README|gaming configuration]]
3. **having issues?** visit [[nixos/troubleshooting/README|troubleshooting]]

## contributing

this is a living document. when you find solutions or improvements:

1. update the relevant page
2. add your experience to troubleshooting
3. link related pages together

---

_Last updated: 2024-04-23_
