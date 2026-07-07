---
title: OPNsense vlan networking for a kubernetes lab
description: proxmox and OPNsense network layout for vlan-based kubernetes lab clusters
date: 2025-08-20
type: guide
tags: [homelab, networking, opnsense, proxmox, vlan, kubernetes, dns]
---

this layout keeps proxmox simple: one vlan-aware bridge, then use vlan tags to decide which network each vm lands on. OPNsense does the routing, dhcp, and dns work.

## topology

```text
intel nic -> vmbr1 (vlan-aware)
├── opnsense net0: no vlan tag (wan - 192.168.10.101)
├── opnsense net1: vlan 101 (lan - 10.10.10.1/24)
├── vm1: vlan 101 (10.10.10.x)
├── vm2: vlan 102 (10.20.20.x)
└── vm3: vlan 103 (10.30.30.x)
```

## proxmox vm settings

- storage: ufs
- memory: `2-4gb`
- cpu: `2-4` cores
- `net0`: `vmbr1`, untagged wan
- `net1`: `vmbr1`, vlan `101` lan

## wan config on a private network

if wan is connected to another private lan instead of the real internet, disable these checks on the wan interface:

- block private networks
- block bogon networks

otherwise OPNsense drops the very traffic you actually want from `192.168.x.x`.

set wan to a static address so it does not fight with upstream dhcp:

```text
interfaces -> wan
type: static ipv4
ipv4 address: 192.168.10.101/24
ipv4 upstream gateway: 192.168.10.1
```

## web ui from wan

by default, wan access to the web ui is blocked. to allow it:

### administration settings

```text
system -> settings -> administration
listen interfaces: all
protocol: http+https or https only
```

### wan firewall rule

allow tcp from `192.168.10.0/24` to the wan address on ports `80,443`.

important detail: set the rule gateway to `default` so `reply-to` is effectively disabled. that avoids asymmetric routing when you access OPNsense from the same network the wan interface lives on.

## dns

use `.lan` names for local services, for example:

- `hubble.kube-prd.lan`
- `grafana.kube-prd.lan`
- `argocd.kube-mgmt.lan`

for host overrides, point them at the cilium load balancer ip. if you want one record for everything in a zone, use a wildcard override:

- host: `*`
- domain: `kube-prd.lan`
- ip: `10.10.10.120`

## network segments

- management: `10.10.10.0/24`
- production: `10.10.10.0/24`

both clusters share the same segment here for simplicity.

## firewall rules worth remembering

- allow `6443/tcp` to kubernetes api endpoints
- allow `80/tcp` and `443/tcp` to cilium ingress ips
- allow inter-cluster traffic if the clusters need to talk to each other

## load balancer range

reserve a small block for cilium load balancers, for example `10.10.10.120-10.10.10.129`, and keep that range out of dhcp.
