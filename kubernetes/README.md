# kubernetes

documentation for kubernetes cluster management using talos linux, cluster api, and proxmox.

## overview

this setup uses:
- **talos linux**: immutable kubernetes os
- **cluster api (capi)**: declarative cluster lifecycle management  
- **proxmox**: virtualization platform
- **cilium**: cni with ingress and load balancing
- **argocd**: gitops continuous deployment

## components

- [talos/](./Talos/) - talos linux configuration and troubleshooting
- [clusterapi/](./ClusterAPI/) - cluster api setup and management
- [proxmox/](./Proxmox/) - proxmox integration and networking
- [cilium/](./Cilium/) - cilium cni and networking configuration

## architecture

```bash
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   kube-mgmt     │    │    kube-prd      │    │    proxmox      │
│  (management)   │    │  (production)    │    │   (hardware)    │
│                 │    │                  │    │                 │
│ • argocd        │───▶│ • talos linux    │───▶│ • vms           │
│ • cluster api   │    │ • cilium cni     │    │ • networking    │
│ • reflector     │    │ • workloads      │    │ • storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```bash
