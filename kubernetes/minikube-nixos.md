---
title: "minikube on NixOS"
tags: [kubernetes, minikube, nixos]
---

# minikube

## run minikube with podman

minikube delete
minikube config set rootless true
minikube start --driver=podman --container-runtime=cri-o
