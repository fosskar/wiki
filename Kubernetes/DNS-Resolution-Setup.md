# DNS Resolution for Kubernetes Ingress

> [!INFO] Overview
> When setting up ingress controllers in Kubernetes clusters, proper DNS resolution is critical for accessing services via domain names instead of IP addresses.

## Problem Overview

In a typical home lab setup with:
- Home router (OpenWrt) on network A
- Kubernetes cluster on network B (via OPNsense)
- LoadBalancer services with L2 announcements

DNS resolution can become complex when domains need to resolve across network boundaries.

## Key Concepts

### DNS Server vs Address Resolution

There are two main approaches for handling custom domains:

1. **DNS Server Forwarding**: Forward queries to another DNS server
   ```bash
   server=/domain.com/10.0.0.1
   ```

2. **Address Resolution**: Directly resolve domain to IP
   ```bash
   address=/domain.com/10.0.0.100
   ```bash

### Network Interface Considerations

DNS servers (like Unbound) can listen on specific interfaces:
- Single interface: Only accessible from that network
- All interfaces: Accessible from multiple networks
- Interface-specific overrides: Different DNS entries per interface

## Solution Approaches

### Method 1: DNS Server Forwarding
Configure your primary router to forward specific domain queries to another DNS server.

**Example in dnsmasq:**
```bash
server=/cluster.local/192.168.1.100
```bash

> [!SUCCESS] Pros
> - Centralized DNS management
> - Automatic wildcard support

> [!WARNING] Cons
> - Can be blocked by DNS filtering
> - More complex troubleshooting
>

### Method 2: Direct Address Resolution
Configure your primary router to directly resolve domains to IPs.

**Example in dnsmasq:**
```bash
address=/cluster.local/10.0.0.100
```bash

**Pros:**
- Simple and reliable
- Bypasses filtering issues
- Wildcard support

**Cons:**
- Need to manage entries in multiple places

### Method 3: Individual Host Entries
Add specific hostname entries to your router.

**Example:**
- Hostname: `service`
- Domain: `cluster.local`
- IP: `10.0.0.100`

**Pros:**
- Most compatible with router UIs
- Simple to configure

**Cons:**
- Must add each subdomain manually
- No wildcard support

## Troubleshooting DNS Issues

### Verify DNS Server Locations
Different network interfaces may have different DNS configurations:
```bash
# Test different DNS servers
nslookup domain.com 192.168.1.1
nslookup domain.com 10.0.0.1
```bash

### Check DNS Blocking
Look for blocked queries in DNS logs:
```bash
dig @192.168.1.1 domain.com
# Look for "EDE: 15 (Blocked)" in output
```bash

### Test Wildcard Resolution
Verify that wildcard DNS works as expected:
```bash
nslookup test.your-domain.lan
nslookup another-test.your-domain.lan
```bash

## Best Practices

1. **Use address resolution** for simple home lab setups
2. **Document your DNS architecture** - multi-router setups get complex
3. **Test from client machines**, not just the router itself
4. **Consider systemd-resolved** behavior on Linux clients
5. **Keep DNS entries consistent** across all DNS servers in your network

## Example Implementation

For a Kubernetes cluster with Cilium ingress using shared LoadBalancer mode:

1. Configure LoadBalancer IP pool in cluster
2. Verify L2 announcements are working
3. Add DNS entries on your primary router:
   ```bash
   address=/cluster.local/10.0.0.100
   ```bash
4. Test resolution and HTTP access
5. Remove TLS configuration until certificates are properly set up

This approach provides reliable access to Kubernetes services via custom domain names in home lab environments.

