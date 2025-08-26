# systems administration wiki

comprehensive knowledge base for modern infrastructure management covering nixos, kubernetes, and virtualization. battle-tested configurations and practical guides for production deployments.

## what's inside

this wiki contains **production-ready configurations** and detailed guides for:

- **nixos ecosystem** - flake-based configurations, luks encryption, hardware optimization
- **kubernetes orchestration** - talos linux, cluster api, cilium networking, gitops workflows  
- **virtualization platforms** - proxmox clustering, ZFS storage, network optimization
- **security hardening** - yubikey authentication, gpg/ssh integration, automated secrets management

## quick start

| if you're... | start here |
|--------------|-----------|
| **new to nixos** | [[nixos/installation/README\|complete installation guide]] |
| **setting up gaming** | [[nixos/gaming/cs2/launch-options\|cs2 optimization]] |
| **deploying kubernetes** | [[kubernetes/README\|cluster architecture]] |
| **managing proxmox** | [[proxmox/zfs\|ZFS raid setup]] |
| **hardening security** | [[nixos/security/yubikey-gpg-ssh-setup\|yubikey guide]] |

## major sections

### nixos configuration
complete linux desktop and server management with reproducible builds

**highlights:**
- [step-by-step installation with luks encryption](nixos/installation/README.md)
- [flake-based system configuration](nixos/configuration/README.md) 
- [yubikey gpg/ssh setup guide](nixos/security/yubikey-gpg-ssh-setup.md)
- [gaming optimization for cs2/hyprland](nixos/gaming/cs2/launch-options.md)
- [bootloader recovery procedures](nixos/troubleshooting/re-installing-the-bootloader.md)

### kubernetes orchestration  
enterprise-grade cluster management with declarative infrastructure

**architecture:**
- **talos linux** - immutable kubernetes os
- **cluster api** - lifecycle management
- **cilium** - cni with load balancing  
- **argocd** - gitops deployments
- **proxmox** - vm orchestration

**key guides:**
- [cilium argocd sync waves](kubernetes/cilium/cilium-argocd-sync-waves.md)
- [cluster api secret management](kubernetes/clusterapi/secret-management.md)
- [talos bootstrap troubleshooting](kubernetes/talos/bootstrap-issues.md)

### virtualization infrastructure
proxmox-based virtualization with high availability storage

**coverage:**
- [ZFS raid1 conversion guide](proxmox/zfs.md)
- [opnsense firewall setup](proxmox/opnsense-setup.md)
- [vm management automation](kubernetes/proxmox/vm-management.md)

## practical approach

this wiki focuses on **real-world implementations** with:

- tested on actual production systems
- complete command examples with explanations
- comprehensive troubleshooting sections
- security-first configuration patterns
- performance optimization guides

## conventions

### documentation standards
- **yaml frontmatter** with metadata (difficulty, time estimates, categories)
- **obsidian-compatible** internal linking with `[[page|alias]]` syntax
- **consistent formatting** following lowercase naming conventions
- **practical examples** with bash/nix code blocks and verification steps

### file organization
```
wiki/
├── nixos/           # linux system management
│   ├── installation/    # step-by-step setup guides
│   ├── configuration/   # system config references  
│   ├── security/       # hardening and authentication
│   └── gaming/         # performance optimization
├── kubernetes/      # container orchestration
│   ├── cilium/         # networking configuration
│   ├── clusterapi/     # lifecycle management
│   └── talos/          # immutable os setup
└── proxmox/         # virtualization platform
    └── [vm management, storage, networking]
```

## target audience

- **system administrators** managing modern linux infrastructure
- **devops engineers** deploying kubernetes workloads  
- **security professionals** implementing hardware-backed authentication
- **gaming enthusiasts** optimizing nixos for performance
- **homelab operators** running proxmox virtualization stacks

---

*comprehensive guides for the modern infrastructure stack*
