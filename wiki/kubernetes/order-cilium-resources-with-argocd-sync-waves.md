---
title: order cilium resources with argocd sync waves
description: use argocd sync waves so cilium crds, ippools, ingress, and hubble come up in dependency order
date: 2025-08-20
type: guide
---

cilium's custom resources only work after the chart has installed its crds. the ingress service also depends on the load balancer ippool already existing. without ordering, argocd tries to apply everything at once and the first sync fails on resources whose crds or dependencies do not exist yet.

## order

- wave `0`: main cilium chart
- wave `1`: `CiliumLoadBalancerIPPool` and `CiliumL2AnnouncementPolicy`
- wave `2`: cilium ingress service
- wave `3`: hubble ui and its ingress

argocd waits for each wave to go healthy before moving on, so this turns an implicit dependency chain into an explicit one.

## ippool and l2 announcement templates

both resources come from the cluster chart. add the wave annotation to `templates/loadbalancer-ippool.yaml` and `templates/l2announcement-policy.yaml`:

```yaml
# cluster chart templates (this setup), both files
metadata:
  name: {{ .Values.name }}
  annotations:
    argocd.argoproj.io/sync-wave: "1"
```

## cilium values

```yaml
# cilium helm values (this setup)
ingressController:
  service:
    annotations:
      argocd.argoproj.io/sync-wave: "2"

hubble:
  annotations:
    argocd.argoproj.io/sync-wave: "3"
  ui:
    annotations:
      argocd.argoproj.io/sync-wave: "3"
```

## verify

```bash
argocd app get <cilium-app>
```

expected: `Sync Status: Synced` and `Health Status: Healthy` on the first sync, without manual retries — the ippool, ingress service, and hubble resources come up in wave order instead of failing on missing crds.

## related

- [[cilium-shared-ingress-ip|cilium shared ingress ip]]
