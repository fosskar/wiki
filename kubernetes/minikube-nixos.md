---
title: "minikube on NixOS"
tags: [kubernetes, minikube, nixos]
date: 2025-03-29
---

# minikube

## run minikube with podman

minikube delete
minikube config set rootless true
minikube start --driver=podman --container-runtime=cri-o
