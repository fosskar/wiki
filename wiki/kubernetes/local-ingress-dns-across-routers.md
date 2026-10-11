---
title: local ingress dns across routers
description: make local dns resolve kubernetes ingress names across router and subnet boundaries
date: 2025-08-23
type: troubleshooting
---

## symptom

ingress is reachable by ip but not by name from the home network.

## cause

usually not kubernetes. it is dns between subnets: clients ask the home router, and the home router does not know the names that live behind the second router.

setup shape:

- home router on network a
- kubernetes cluster on network b through OPNsense
- cilium announces load balancer ips on the local network

the examples use `<home-router-ip>`, `<cluster-dns-ip>` (the dns server on the cluster side), and `<ingress-ip>` (the shared load balancer ip).

## diagnose

### test each dns server directly

```bash
nslookup <host>.<local-domain> <home-router-ip>
nslookup <host>.<local-domain> <cluster-dns-ip>
```

if only the cluster-side server answers, the home router is missing the records.

### check for filtering

```bash
dig @<home-router-ip> <host>.<local-domain>
```

if you see `EDE: 15 (Blocked)`, the answer is being filtered before it even reaches the cluster-side dns.

### test wildcard behavior

```bash
nslookup test.<local-domain>
nslookup another-test.<local-domain>
```

both should return the shared ingress ip if a wildcard-style record is in place.

## fix

three workable patterns. answering directly on the home router ended up being the simplest here.

### answer directly on the home router

```bash
# dns override on the home router (dnsmasq syntax)
address=/<local-domain>/<ingress-ip>
```

the most reliable option here. it cuts out cross-router forwarding and still gives wildcard-style resolution for anything under the domain. with a shared cilium ingress ip, this one line covers every hostname; ingress routes by hostname after the traffic arrives.

### forward a whole domain to another dns server

```bash
# dns override on the home router (dnsmasq syntax)
server=/<local-domain>/<cluster-dns-ip>
```

keeps records centralized and works well if you already trust the downstream dns server. the downside is another moving part, and it can get tangled up with dns filtering.

### create individual host entries

- host: `service`
- domain: `<local-domain>`
- ip: `<ingress-ip>`

the most ui-friendly option, but you lose wildcard support and have to add every hostname by hand.

## related

- [[cilium-shared-ingress-ip|cilium shared ingress ip]]
