---
title: "proxmox vm management"
tags: [kubernetes, proxmox, virtualization]
---

# proxmox vm management

## protection mode

### issue

when vms have protection mode enabled, cluster api cannot automatically delete them during cluster cleanup.

### symptoms

- vms shutdown but remain in proxmox after cluster deletion
- capmox controller logs show deletion failures
- manual cleanup required

### solution

disable protection mode for cluster api managed vms:

1. in proxmox ui: vm → options → protection → uncheck
2. or set default protection mode to disabled for cluster api vm templates

### recommendations

- rely on gitops/rbac for protection instead of vm protection mode
- use separate proxmox users with limited permissions for cluster api
- enable protection mode only for critical infrastructure vms

## networking

### vm ip assignment

cluster api automatically assigns ips from configured range:

````yaml
# cluster/values.yaml
network:
  ipRange: "10.10.10.101-10.10.10.110"
  gateway: 10.10.10.1
```bash

### vm id allocation
use predictable vm id ranges per cluster:

```yaml
proxmox:
  vmIdRange: "111-115"  # 4 vms max
```bash

## storage

### disk configuration
vms use local-lvm storage by default. ensure sufficient space for:
- os disk: 20gb minimum
- worker nodes: 100gb+ for container storage
- control plane: 50gb sufficient

### backup considerations
- cluster api vms are cattle, not pets
- backup cluster configurations (gitops repo) instead of individual vms
- use persistent storage classes for stateful workloads
````
