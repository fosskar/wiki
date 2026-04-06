---
title: network latency simulation
description: quick tc netem commands to add or remove latency on a network interface
tags: [gaming, networking, nixos]
date: 2024-05-11
---

`tc netem` is handy when you want to reproduce bad network conditions on purpose instead of guessing. these commands add delay to one interface, which is enough for quick game or app testing.

## remove delay

```bash
tc qdisc del dev enp14s0 root netem
```

## add delay

```bash
tc qdisc add dev enp14s0 root netem delay 20ms
```

## change existing delay

```bash
tc qdisc change dev enp14s0 root netem delay 20ms
```
