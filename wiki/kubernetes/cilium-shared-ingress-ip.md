---
title: cilium shared ingress ip
description: configure cilium ippools and l2 announcements so multiple ingresses share one local load balancer ip
date: 2025-08-20
type: guide
---

this setup uses one shared load balancer ip for all ingress traffic. that keeps local dns simple: every `*.kube-prd.lan` name points at one address, and ingress routes by host header after the request lands.

## shared ippool

```yaml
# cluster chart values (this setup), rendered into cilium CRDs
loadBalancerIPPool:
  enabled: true
  name: kube-prd-lb-pool
  cidr: "10.10.10.120/32"

ingressController:
  loadbalancerMode: shared
```

`/32` means cilium gets exactly one ip to hand out. `shared` mode is the reason multiple ingresses can sit behind that single address.

## l2 announcement policy

```yaml
# cluster chart values (this setup), rendered into cilium CRDs
l2AnnouncementPolicy:
  enabled: true
  name: kube-prd-l2-policy
  loadBalancerIPs: true
  externalIPs: true
  interfaces:
    - "^eth[0-9]+$"
```

l2 announcements matter because they make the chosen node answer for the service ip on the local network. without that, dns can resolve correctly and traffic still goes nowhere.

## dns

configure local dns so service names resolve to the shared ingress ip:

- `hubble.kube-prd.lan` → `10.10.10.120`
- `grafana.kube-prd.lan` → `10.10.10.120`

## example ingress

```yaml
# example ingress manifest (this setup)
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
```

## troubleshooting

### ip not announced

```bash
kubectl get ciliuml2announcementpolicy
kubectl describe ciliumloadbalancerippool
```

### service not reachable

```bash
kubectl get svc cilium-ingress
kubectl get pods -l app.kubernetes.io/name=cilium-agent
```

### dns not resolving

check the router dns entry and make sure it points at the same ip from the ippool.

## verify

```bash
kubectl get svc cilium-ingress
```

expected: `EXTERNAL-IP` shows `10.10.10.120` (the single ip from the pool). then any `*.kube-prd.lan` name should resolve to that ip and the corresponding page should load.

## related

- [[local-ingress-dns-across-routers|local ingress dns across routers]]
- [[talos-kubernetes-bootstrap-issues|talos kubernetes bootstrap issues]]
