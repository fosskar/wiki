---
title: "dns resolution for kubernetes ingress"
tags: [proxmox, dns, kubernetes]
date: 2025-08-23
---

# dns resolution for kubernetes ingress

> [!INFO] overview
> when setting up ingress controllers in kubernetes clusters, proper DNS resolution is critical for accessing services via domain names instead of IP addresses.

## problem overview

in a typical home lab setup with:

- home router (OpenWrt) on network A
- kubernetes cluster on network B (via OPNsense)
- LoadBalancer services with L2 announcements

DNS resolution can become complex when domains need to resolve across network boundaries.

## key concepts

### DNS server vs address resolution

there are two main approaches for handling custom domains:

1. **DNS server forwarding**: forward queries to another DNS server

   ```bash
   server=/domain.com/10.0.0.1
   ```

2. **address resolution**: directly resolve domain to IP
   ````bash
   address=/domain.com/10.0.0.100
   ```bash
   ````

### network interface considerations

DNS servers (like Unbound) can listen on specific interfaces:

- single interface: only accessible from that network
- all interfaces: accessible from multiple networks
- interface-specific overrides: different DNS entries per interface

## solution approaches

### method 1: DNS server forwarding

configure your primary router to forward specific domain queries to another DNS server.

**example in dnsmasq:**

````bash
server=/cluster.local/192.168.1.100
```bash

> [!SUCCESS] pros
> - centralized DNS management
> - automatic wildcard support

> [!WARNING] cons
> - can be blocked by DNS filtering
> - more complex troubleshooting
>

### method 2: direct address resolution
configure your primary router to directly resolve domains to IPs.

**example in dnsmasq:**
```bash
address=/cluster.local/10.0.0.100
```bash

**pros:**
- simple and reliable
- bypasses filtering issues
- wildcard support

**cons:**
- need to manage entries in multiple places

### method 3: individual host entries
add specific hostname entries to your router.

**example:**
- hostname: `service`
- domain: `cluster.local`
- IP: `10.0.0.100`

**pros:**
- most compatible with router UIs
- simple to configure

**cons:**
- must add each subdomain manually
- no wildcard support

## troubleshooting DNS issues

### verify DNS server locations
different network interfaces may have different DNS configurations:
```bash
# test different DNS servers
nslookup domain.com 192.168.1.1
nslookup domain.com 10.0.0.1
```bash

### check DNS blocking
look for blocked queries in DNS logs:
```bash
dig @192.168.1.1 domain.com
# look for "EDE: 15 (Blocked)" in output
```bash

### test wildcard resolution
verify that wildcard DNS works as expected:
```bash
nslookup test.your-domain.lan
nslookup another-test.your-domain.lan
```bash

## best practices

1. **use address resolution** for simple home lab setups
2. **document your DNS architecture** - multi-router setups get complex
3. **test from client machines**, not just the router itself
4. **consider systemd-resolved** behavior on linux clients
5. **keep DNS entries consistent** across all DNS servers in your network

## example implementation

for a kubernetes cluster with Cilium ingress using shared LoadBalancer mode:

1. configure LoadBalancer IP pool in cluster
2. verify L2 announcements are working
3. add DNS entries on your primary router:
   ```bash
   address=/cluster.local/10.0.0.100
   ```bash
4. test resolution and HTTP access
5. remove TLS configuration until certificates are properly set up

this approach provides reliable access to kubernetes services via custom domain names in home lab environments.
````
