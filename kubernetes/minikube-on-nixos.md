---
title: minikube on NixOS
description: quick minikube startup with podman and cri-o on NixOS
tags: [kubernetes, minikube, nixos]
date: 2025-03-29
---

this uses podman instead of docker and flips minikube into rootless mode first. that matches a more typical NixOS setup where podman is already around and you want to avoid a second container stack just for local kubernetes.

```bash
minikube delete
minikube config set rootless true
minikube start --driver=podman --container-runtime=cri-o
```
