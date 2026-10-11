---
title: talos kubernetes bootstrap issues
description: troubleshoot talos bootstrap problems around cilium regressions, csr approval, and host dns
date: 2025-08-20
type: troubleshooting
---

three ways a talos cluster with cilium failed to come up cleanly on this setup. each section is symptom → cause → fix.

## cilium 1.18.x bootstrap deadlock

### symptom

- cilium pods stuck in `Init:0/5`
- nodes stuck `NotReady`
- kubelet tls errors
- pending kubelet-serving csrs

### cause

on this setup, cilium `1.18.x` can deadlock talos bootstrap:

- kubelet needs serving certs approved
- the approver needs the cluster networking stack running
- cilium needs kubelet tls working first

upstream: [cilium issue #40983](https://github.com/cilium/cilium/issues/40983)

### fix

pin cilium to `1.17.7`:

```yaml
# cluster/values.yaml (this setup)
cni:
  cilium:
    version: "1.17.7"
```

## pending kubelet-serving csrs

### symptom

kubelet-serving csrs stay pending and bootstrap does not progress.

### cause

nothing approves kubelet serving certs on its own. talos config includes `kubelet-serving-cert-approver` for that:

```yaml
# talos machine config (this setup)
- https://raw.githubusercontent.com/alex1989hu/kubelet-serving-cert-approver/main/deploy/standalone-install.yaml
```

but the approver itself needs a working cluster, so it cannot help once bootstrap is already wedged.

### fix

approve the pending serving csrs manually:

```bash
kubectl certificate approve $(kubectl get csr -o name | grep kubelet-serving)
```

## coredns crashes when cilium restarts

### symptom

coredns crashes when cilium restarts with bpf masquerading.

### fix

worker config:

```yaml
# talos worker machine config (this setup)
machine:
  features:
    hostDNS:
      enabled: true
      forwardKubeDNSToHost: false
```

## related

- [[cilium-shared-ingress-ip|cilium shared ingress ip]]
