---
title: order cilium resources with argocd sync waves
description: use argocd sync waves so cilium crds, ippools, ingress, and hubble come up in dependency order
date: 2025-08-20
type: guide
tags: [kubernetes, cilium, argocd, gitops, helm]
---

cilium's custom resources only work after the chart has installed its crds. the ingress service also depends on the load balancer ippool already existing. without ordering, argocd tries to apply everything at once and the first sync fails for no good reason.

## order

- wave `0`: main cilium chart
- wave `1`: `CiliumLoadBalancerIPPool` and `CiliumL2AnnouncementPolicy`
- wave `2`: cilium ingress service
- wave `3`: hubble ui and its ingress

argocd waits for each wave to go healthy before moving on, so this turns an implicit dependency chain into an explicit one.

## ippool and l2 announcement templates

add this to `templates/loadbalancer-ippool.yaml` and `templates/l2announcement-policy.yaml`:

```yaml
metadata:
  name: { { .Values.name } }
  annotations:
    argocd.argoproj.io/sync-wave: "1"
```

## cilium values

```yaml
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
