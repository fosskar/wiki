---
title: proxmox vm protection and ranges for cluster api
description: avoid stuck cluster api cleanup by disabling proxmox vm protection and reserving vm ids, ip ranges, and storage sizes
date: 2025-08-20
type: note
---

cluster api creates and deletes proxmox vms on its own, so proxmox has to let it, and its vms need ids, ips, and disks that never collide with hand-made ones.

## disable protection for cluster api vms

proxmox protection is useful for pets. cluster api nodes are cattle. if protection is on, cluster api can shut a vm down but proxmox will refuse to delete it, which leaves dead clusters half-cleaned up.

disable protection for any vm or template that cluster api owns:

- per vm: proxmox ui → vm → options → protection → uncheck
- or make templates default to protection disabled

for safety, rely on rbac and separate proxmox users instead of vm protection on disposable worker and control plane nodes.

## network ranges

node ips come from a fixed range on the lab lan (example addresses):

```yaml
# cluster/values.yaml (this setup)
network:
  ipRange: "172.16.20.101-172.16.20.110"
  gateway: 172.16.20.1
```

## vm id ranges

```yaml
# cluster/values.yaml (this setup)
proxmox:
  vmIdRange: "111-115"
```

a dedicated id range makes it obvious which vms belong to which cluster and avoids accidental collisions with hand-made vms.

## storage sizing

- os disk: `20gb` minimum
- worker nodes: `100gb+` for container storage
- control plane: `50gb` is enough

back up the gitops repo and persistent workload data, not the cluster api nodes themselves.

## related

- [[reflect-proxmox-credentials-for-cluster-api|reflect proxmox credentials for cluster api]]
