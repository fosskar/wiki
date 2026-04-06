---
title: "cilium load balancer configuration"
tags: [kubernetes, cilium, networking]
---

# cilium load balancer configuration

## ippool configuration

### shared mode setup

use single ip for all ingress services:

````yaml
# cilium/values.yaml
loadBalancerIPPool:
  enabled: true
  name: kube-prd-lb-pool
  cidr: "10.10.10.120/32"  # single ip

ingressController:
  loadbalancerMode: shared  # all ingress use same ip
```bash

### l2 announcement policy
announce loadbalancer ips on local network:

```yaml
l2AnnouncementPolicy:
  enabled: true
  name: kube-prd-l2-policy
  loadBalancerIPs: true
  externalIPs: true
  interfaces:
    - "^eth[0-9]+$"
```bash

## dns integration

### local dns resolution
configure router dns for `*.cluster.lan` pattern:
- `hubble.kube-prd.lan` → `10.10.10.120`
- `grafana.kube-prd.lan` → `10.10.10.120`
- all services share same ip, routed by host header

### ingress configuration
```yaml
# example ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hubble-ui
spec:
  rules:
  - host: hubble.kube-prd.lan
    http:
      paths:
      - path: /
        backend:
          service:
            name: hubble-ui
            port:
              number: 80
```bash

## troubleshooting

### ip not announced
check l2 announcement status:
```bash
kubectl get ciliuml2announcementpolicy
kubectl describe ciliumloadbalancerippool
```bash

### service not reachable
verify ingress controller:
```bash
kubectl get svc cilium-ingress
kubectl get pods -l app.kubernetes.io/name=cilium-agent
```bash

### dns not resolving
check router dns configuration and cilium service status.
````
