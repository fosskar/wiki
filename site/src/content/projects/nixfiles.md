---
title: nixfiles
description: personal nixos infrastructure managed with clan-core
repo: https://codeberg.org/fosskar/nixfiles
tags: [nixos, clan-core, flake-parts, home-manager]
order: 0
---

Aspect-oriented NixOS configuration for five machines — desktop, laptop, two
home servers, and a VPS gateway — plus declarative OpenWrt router/AP
management. Feature modules export reusable aspects through `flake.modules.*`,
composed into concrete systems by clan roles and machine imports.
