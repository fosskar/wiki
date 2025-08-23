# cluster api secret management

## problem
proxmox credentials need to be available in every `cluster-*` namespace for cluster api to provision vms.

manually creating secrets in each namespace is tedious and error-prone.

## solution: reflector

### installation
```yaml
# bootstrap/kube-mgmt/reflector.yaml
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
```bash

### configuration
annotate the source secret in default namespace:

```bash
kubectl annotate secret proxmox-credentials -n default \
  reflector.v1.k8s.emberstack.com/reflection-allowed="true" \
  reflector.v1.k8s.emberstack.com/reflection-allowed-namespaces="cluster-.*" \
  reflector.v1.k8s.emberstack.com/reflection-auto-enabled="true" \
  reflector.v1.k8s.emberstack.com/reflection-auto-namespaces="cluster-.*"
```bash

### how it works
1. reflector watches for new namespaces matching `cluster-.*`
2. automatically creates `proxmox-credentials` secret in new namespaces
3. keeps secrets synchronized with source secret

### secret format
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: proxmox-credentials
stringData:
  url: "https://192.168.1.X:8006"
  token: "username@pve!token"
  secret: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
```bash

## cleanup automation

### helmchartproxy finalizers
add to argocd helmchartproxy to prevent stuck finalizers when vms are deleted:

```yaml
metadata:
  annotations:
    addons.cluster.x-k8s.io/deletion-policy: "skip-delete"
```bash

prevents argocd from trying to uninstall helm charts from deleted clusters.
