---
title: talos bootstrap issues
description: notes on cilium bootstrap regressions, csr approval, and dns settings on talos
tags: [kubernetes, talos, troubleshooting]
date: 2025-08-20
---

## cilium 1.18.x regression

on this setup, cilium `1.18.x` can deadlock talos bootstrap:

- kubelet needs serving certs approved
- the approver needs the cluster networking stack running
- cilium needs kubelet tls working first

symptoms:

- cilium pods stuck in `Init:0/5`
- nodes stuck `NotReady`
- kubelet tls errors
- pending kubelet-serving csrs

pin cilium to `1.17.7`:

```yaml
# cluster/values.yaml
cni:
  cilium:
    version: "1.17.7"
```

reference: [cilium issue #40983](https://github.com/cilium/cilium/issues/40983)

## certificate approval

talos config includes `kubelet-serving-cert-approver`:

```yaml
- https://raw.githubusercontent.com/alex1989hu/kubelet-serving-cert-approver/main/deploy/standalone-install.yaml
```

if bootstrap is already wedged, approve the pending serving csrs manually:

```bash
kubectl certificate approve $(kubectl get csr -o name | grep kubelet-serving)
```

## coredns and host dns

worker config:

```yaml
machine:
  features:
    hostDNS:
      enabled: true
      forwardKubeDNSToHost: false
```

this avoids coredns crashing when cilium restarts with bpf masquerading.
