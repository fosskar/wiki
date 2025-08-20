# cilium argocd sync waves

## problem

when deploying cilium through argocd, custom resources like `CiliumLoadBalancerIPPool` and `CiliumL2AnnouncementPolicy` fail to deploy because they depend on crds that aren't installed yet.

additionally, cilium ingress service depends on the loadbalancer ippool being available.

## solution

use argocd sync waves to control deployment order:

### wave 0 (default)
- main cilium helm chart
- installs crds and operator

### wave 1
- `CiliumLoadBalancerIPPool`
- `CiliumL2AnnouncementPolicy`

### wave 2
- cilium ingress service (depends on ippool)

### wave 3
- hubble ui (with ingress)

## configuration

### ippool and l2announcement templates
add to `templates/loadbalancer-ippool.yaml` and `templates/l2announcement-policy.yaml`:

```yaml
metadata:
  name: {{ .Values.name }}
  annotations:
    argocd.argoproj.io/sync-wave: "1"
```bash

### cilium values.yaml
```yaml
ingressController:
  service:
    annotations:
      argocd.argoproj.io/sync-wave: "2"

hubble:
  annotations:
    argocd.argoproj.io/sync-wave: "3"
  ui:
    annotations:
      argocd.argoproj.io/sync-wave: "3"
```bash

## notes

- sync waves ensure proper dependency order
- argocd waits for each wave to be healthy before proceeding
- prevents circular dependencies between resources
- essential for cilium 1.17.7+ with talos linux
