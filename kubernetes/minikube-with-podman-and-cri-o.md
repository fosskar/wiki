---
title: minikube with podman and cri-o
description: start minikube with the podman driver, rootless mode, and cri-o instead of docker
date: 2025-03-29
type: note
tags: [kubernetes, minikube, podman, cri-o, local-dev]
---

this uses podman instead of docker and flips minikube into rootless mode first. the important part is the explicit driver/runtime combination: minikube defaults to docker unless you tell it otherwise.

```bash
minikube delete
minikube config set rootless true
minikube start --driver=podman --container-runtime=cri-o
```
