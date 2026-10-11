---
title: nixlens
description: read-only overview of nixos machines, their storage, networks and apps
repo: https://github.com/fosskar/nixlens
tags: [nixos, go, react, homelab]
order: 1
---

NixOS declares a system but never shows it: which disk sits in which pool,
which interface has which address, which app runs where. nixlens is the view
onto it, a home screen in the spirit of umbrelOS or ZimaOS that manages
nothing. Unprivileged agents report machines, ZFS/md/btrfs storage, SMART
health without waking sleeping drives, and network links to one hub over
mutual TLS; apps declared in Nix show up as a launcher grid. Alpha.
