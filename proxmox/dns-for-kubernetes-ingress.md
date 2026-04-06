---
title: dns resolution for kubernetes ingress
description: ways to make local dns resolve ingress names across router boundaries in a homelab
tags: [proxmox, dns, kubernetes]
date: 2025-08-23
---

when ingress is reachable by ip but not by name, the real problem is usually not kubernetes. it is dns between subnets. this page is about the three workable patterns and why `address=` ended up being the simplest one here.

## setup shape

- home router on network a
- kubernetes cluster on network b through OPNsense
- cilium announces load balancer ips on the local network

## options

### forward a whole domain to another dns server

```bash
server=/cluster.local/10.0.0.1
```

this keeps records centralized and works well if you already trust the downstream dns server. the downside is that it adds another moving part and can get tangled up with dns filtering.

### answer directly on the primary router

```bash
address=/cluster.local/10.0.0.100
```

this was the most reliable option here. it cuts out cross-router forwarding and still gives wildcard-style resolution for anything under the domain.

### create individual host entries

- host: `service`
- domain: `cluster.local`
- ip: `10.0.0.100`

this is the most ui-friendly option, but you lose wildcard support and have to add every hostname by hand.

## troubleshooting

### test different dns servers directly

```bash
nslookup domain.com 192.168.1.1
nslookup domain.com 10.0.0.1
```

### check for filtering

```bash
dig @192.168.1.1 domain.com
```

if you see `EDE: 15 (Blocked)`, the answer is being filtered before it even reaches the cluster-side dns.

### test wildcard behavior

```bash
nslookup test.your-domain.lan
nslookup another-test.your-domain.lan
```

## example

for a shared cilium ingress ip, point the whole local domain at that one address:

```bash
address=/cluster.local/10.0.0.100
```

then let ingress route by hostname after the traffic arrives.
