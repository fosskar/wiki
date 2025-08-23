# talos bootstrap issues

## cilium 1.18.x regression

### problem
cilium 1.18.x has a bootstrap regression with talos linux causing circular dependency:
- kubelet needs serving certificates approved
- kubelet-serving-cert-approver needs cni to run
- cilium needs kubelet tls to work

### symptoms
- cilium pods stuck in `Init:0/5` state
- nodes remain `NotReady`
- kubelet logs show tls internal errors
- pending kubelet-serving csrs

### solution
downgrade to cilium 1.17.7:

```yaml
# cluster/values.yaml
cni:
  cilium:
    version: "1.17.7"
```bash

### references
- [cilium issue #40983](https://github.com/cilium/cilium/issues/40983)
- kubelet-serving-cert-approver includes required tolerations for cloud-provider taints

## certificate approval

### automatic approval
talos config includes kubelet-serving-cert-approver:
```yaml
- https://raw.githubusercontent.com/alex1989hu/kubelet-serving-cert-approver/main/deploy/standalone-install.yaml
```bash

### manual approval (emergency)
```bash
kubectl certificate approve $(kubectl get csr -o name | grep kubelet-serving)
```bash

## dns configuration

### coredns/cilium conflict
add to worker node config:
```yaml
machine:
  features:
    hostDNS:
      enabled: true
      forwardKubeDNSToHost: false
```bash

prevents coredns crashes when cilium restarts with bpf masquerading.
