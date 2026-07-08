---
title: local ingress dns across routers
description: make local dns resolve kubernetes ingress names across router and subnet boundaries
date: 2025-08-23
type: troubleshooting
---

when ingress is reachable by ip but not by name, the real problem is usually not kubernetes. it is dns between subnets. this page is about the three workable patterns and why `address=` ended up being the simplest one here.

## setup shape

- home router on network a
- kubernetes cluster on network b through OPNsense
- cilium announces load balancer ips on the local network

the ips in the examples (`192.168.1.1`, `10.0.0.1`, `10.0.0.100`) are this setup's router, cluster-side dns, and shared ingress ip.

## options

### forward a whole domain to another dns server

```bash
# dns override on the primary router (dnsmasq syntax)
server=/cluster.local/10.0.0.1
```

this keeps records centralized and works well if you already trust the downstream dns server. the downside is that it adds another moving part and can get tangled up with dns filtering.

### answer directly on the primary router

```bash
# dns override on the primary router (dnsmasq syntax)
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
nslookup <domain> 192.168.1.1
nslookup <domain> 10.0.0.1
```

### check for filtering

```bash
dig @192.168.1.1 <domain>
```

if you see `EDE: 15 (Blocked)`, the answer is being filtered before it even reaches the cluster-side dns.

### test wildcard behavior

```bash
nslookup test.<local-domain>
nslookup another-test.<local-domain>
```

## example

for a shared cilium ingress ip, point the whole local domain at that one address:

```bash
# dns override on the primary router (dnsmasq syntax)
address=/cluster.local/10.0.0.100
```

then let ingress route by hostname after the traffic arrives.

## related

- [[cilium-shared-ingress-ip|cilium shared ingress ip]]
- [[opnsense-vlan-networking-for-a-kubernetes-lab|opnsense vlan networking for a kubernetes lab]]
