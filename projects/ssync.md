---
title: ssync
description: peer-to-peer sync of coding-agent sessions across machines
repo: https://github.com/fosskar/ssync
tags: [rust, iroh, age, nixos, clan-core]
order: 3
---

Continuous, serverless sync of coding-agent sessions (pi, omp, Claude Code,
Codex) across your own machines, so a session started on the desktop resumes
on the laptop. Every machine runs the same daemon: sessions are encrypted at
rest with age, published as content-addressed blobs over iroh with NAT
hole-punching, and diverged sessions are merged losslessly. Machines pair
through a shared cluster file or an ad-hoc ticket; under clan the keys and
peer list are generated automatically.
