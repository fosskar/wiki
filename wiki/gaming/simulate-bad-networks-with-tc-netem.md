---
title: simulate bad networks with tc netem
description: use tc netem to add latency, jitter, and packet loss to one linux egress interface for network testing
date: 2024-05-11
type: note
tags: [gaming, linux, networking, tc, netem, testing]
---

use `tc netem` to reproduce latency, jitter, and packet loss on one linux egress interface. remove the qdisc after testing.

warning: using netem in live online matches can count as cheating or network abuse. keep it to local testing, private servers, labs, or controlled reproduction.

## what this changes

these commands attach `netem` as the root qdisc on one interface:

- affects outgoing traffic on that interface
- affects every process using that interface
- does not delay incoming packets on the same host
- replaces the current root qdisc while active

for symmetric "bad internet" simulation, put netem on a router, bridge, network namespace, or both endpoints.

## pick the interface

```bash
ip -o route show default
```

`dev` field = egress interface. examples use `<interface>`.

record the current qdisc:

```bash
tc qdisc show dev <interface>
```

## add fixed latency

```bash
sudo tc qdisc replace dev <interface> root netem delay 20ms
```

`replace` avoids `add`/`change` state errors:

- `add` fails if a qdisc already exists
- `change` fails if the netem qdisc does not exist
- `replace` creates or replaces the root qdisc

## add latency with jitter

```bash
sudo tc qdisc replace dev <interface> root netem delay 40ms 10ms distribution normal
```

adds `40ms` base delay with `10ms` jitter. `distribution normal` avoids uniform jitter.

## add packet loss

```bash
sudo tc qdisc replace dev <interface> root netem delay 40ms loss 1%
```

use for reconnects, interpolation, rubber-banding, or voice/chat behaviour. start small; `1%` loss is visible in realtime traffic.

## inspect the active qdisc

```bash
tc -s qdisc show dev <interface>
```

`-s` shows counters for packets passing through the configured qdisc.

## remove the simulation

```bash
sudo tc qdisc del dev <interface> root
```

if no custom root qdisc exists, `tc` may report that there is nothing to delete.

verify cleanup:

```bash
tc qdisc show dev <interface>
```

## caveats

- netem state persists until the qdisc is deleted or replaced
- ping only verifies the path being tested; `root netem` does not delay ingress
- `root netem` replaces the existing root qdisc
- fixed `delay 20ms` is not a realistic internet model
- large jitter can reorder packets

## references

- [tc-netem(8)](https://man7.org/linux/man-pages/man8/tc-netem.8.html)
- [tc(8)](https://man7.org/linux/man-pages/man8/tc.8.html)
