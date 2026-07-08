---
title: reflect proxmox credentials for cluster api
description: mirror proxmox credentials into cluster namespaces so cluster api can create and delete vms
date: 2025-08-20
type: guide
---

cluster api needs proxmox credentials inside every `cluster-*` namespace. copying the same secret by hand works once, then turns into drift and cleanup pain.

reflector fixes that by treating one secret as the source of truth and mirroring it into matching namespaces.

## install reflector

```yaml
# bootstrap/kube-mgmt/reflector.yaml (this setup)
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
# proxmox-credentials secret, namespace default (this setup)
apiVersion: v1
kind: Secret
metadata:
  name: proxmox-credentials
stringData:
  url: "https://<proxmox-host>:8006"
  token: "<user>@pve!<token-name>"
  secret: "<token-secret>"
```

## cleanup edge case

cluster deletion can get stuck on helmchartproxy finalizers if argocd still tries to uninstall addons from a cluster that already disappeared. this annotation skips that uninstall path:

```yaml
# annotation on the HelmChartProxy resource
metadata:
  annotations:
    addons.cluster.x-k8s.io/deletion-policy: "skip-delete"
```

## verify

```bash
kubectl get secrets -A --field-selector metadata.name=proxmox-credentials
```

expected: the secret listed in `default` and mirrored into every existing `cluster-*` namespace. editing the source secret should propagate to the copies.

## related

- [[proxmox-vm-protection-and-ranges-for-cluster-api|proxmox vm protection and ranges for cluster api]]
