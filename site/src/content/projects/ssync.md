---
title: ssync
description: peer-to-peer sync of coding-agent sessions across machines
repo: https://codeberg.org/fosskar/ssync
tags: [rust, iroh, age, nixos, clan-core]
order: 1
---

Continuous, serverless sync of AI coding-agent session files. Every machine
runs the same daemon: sessions are encrypted at rest with age (post-quantum
hybrid keys), published as content-addressed blobs over iroh with NAT
hole-punching, and merged losslessly when they diverge. Pairs via one-off
ticket, or fully automatic under clan.
