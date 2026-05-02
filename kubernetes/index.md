---
title: kubernetes
description: talos, cilium, cluster api, networking, gitops, and local development notes
date: 2025-08-20
type: index
tags: [kubernetes]
enableToc: false
---

notes from a homelab kubernetes stack built around talos, cilium, cluster api, argocd, and proxmox. pages are grouped by the problem a kubernetes operator would look for first.

## pages

### networking

- [[cilium-shared-ingress-ip|cilium shared ingress ip]]
- [[local-ingress-dns-across-routers|local ingress dns across routers]]

### cluster api

- [[reflect-proxmox-credentials-for-cluster-api|reflect proxmox credentials for cluster api]]
- [[proxmox-vm-protection-and-ranges-for-cluster-api|proxmox vm protection and ranges for cluster api]]

### gitops

- [[order-cilium-resources-with-argocd-sync-waves|order cilium resources with argocd sync waves]]

### talos

- [[talos-kubernetes-bootstrap-issues|talos kubernetes bootstrap issues]]

### local development

- [[minikube-with-podman-and-cri-o|minikube with podman and cri-o]]
