---
title: cluster api secret management
description: reflect proxmox credentials into cluster namespaces so cluster api can create and delete vms
tags: [kubernetes, cluster-api, secrets]
date: 2025-08-20
---

cluster api needs proxmox credentials inside every `cluster-*` namespace. copying the same secret by hand works once, then turns into drift and cleanup pain.

reflector fixes that by treating one secret as the source of truth and mirroring it into matching namespaces.

## install reflector

```yaml
# bootstrap/kube-mgmt/reflector.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: reflector
  namespace: argocd
spec:
  source:
    repoURL: https://emberstack.github.io/helm-charts
    chart: reflector
    targetRevision: 9.1.26
  destination:
    namespace: reflector
```

## annotate the source secret

```bash
kubectl annotate secret proxmox-credentials -n default \
  reflector.v1.k8s.emberstack.com/reflection-allowed="true" \
  reflector.v1.k8s.emberstack.com/reflection-allowed-namespaces="cluster-.*" \
  reflector.v1.k8s.emberstack.com/reflection-auto-enabled="true" \
  reflector.v1.k8s.emberstack.com/reflection-auto-namespaces="cluster-.*"
```

that tells reflector to copy the secret into any namespace that matches `cluster-.*`, and to keep those copies synced when the source changes.

## secret shape

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: proxmox-credentials
stringData:
  url: "https://192.168.1.X:8006"
  token: "username@pve!token"
  secret: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
```

## cleanup edge case

cluster deletion can get stuck on helmchartproxy finalizers if argocd still tries to uninstall addons from a cluster that already disappeared. this annotation skips that uninstall path:

```yaml
metadata:
  annotations:
    addons.cluster.x-k8s.io/deletion-policy: "skip-delete"
```
