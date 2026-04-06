---
title: proxmox vm management
description: notes for running cluster api managed vms on proxmox
tags: [kubernetes, proxmox, virtualization]
date: 2025-08-20
---

## disable protection for cluster api vms

proxmox protection is useful for pets. cluster api nodes are cattle. if protection is on, cluster api can shut a vm down but proxmox will refuse to delete it, which leaves dead clusters half-cleaned up.

disable protection for any vm or template that cluster api owns:

1. proxmox ui → vm → options → protection → uncheck
2. or make templates default to protection disabled

for safety, rely on rbac and separate proxmox users instead of vm protection on disposable worker and control plane nodes.

## network ranges

```yaml
# cluster/values.yaml
network:
  ipRange: "10.10.10.101-10.10.10.110"
  gateway: 10.10.10.1
```

## vm id ranges

```yaml
proxmox:
  vmIdRange: "111-115"
```

a dedicated id range makes it obvious which vms belong to which cluster and avoids accidental collisions with hand-made vms.

## storage sizing

- os disk: `20gb` minimum
- worker nodes: `100gb+` for container storage
- control plane: `50gb` is enough

back up the gitops repo and persistent workload data, not the cluster api nodes themselves.
