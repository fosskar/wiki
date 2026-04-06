---
title: "nixos"
description: "central hub for all NixOS-related documentation and configurations"
tags: [nixos, linux, configuration, flake]
date: 2024-04-23
---

# nixos configuration hub

welcome to the NixOS section of my wiki. this contains everything from installation to advanced configuration.

## 🎯 quick start

### new installation?

- [[nixos/installation/index|complete installation guide]] - fresh install with LUKS
- [[nixos/installation/index|installation guide]] - essential first steps

### existing system?

- [[nixos/configuration|configuration reference]] - system tweaks and optimizations
- [[nixos/troubleshooting-bootloader|problem solver]] - common issues and fixes

## 📁 categories

### [[nixos/installation/index|📦 installation]]

- fresh system installation
- LUKS encryption setup
- flake configuration
- hardware-specific guides

### [[nixos/configuration|⚙️ configuration]]

- system settings
- desktop environments
- package management
- service configuration

### [[nixos/security/index|🔐 security]]

- LUKS encryption
- TPM2 auto-unlock
- secure boot
- firewall configuration

### [[nixos/gaming/index|🎮 gaming]]

- game-specific optimizations
- performance tuning
- graphics drivers
- network optimization

### [[kubernetes/index|☸️ kubernetes]]

- minikube setup
- container configuration
- orchestration guides

### [[nixos/troubleshooting-bootloader|🔧 troubleshooting]]

- boot issues
- package problems
- system recovery
- performance debugging

## 🔗 quick links

- [[nixos/flake-templates|flake templates]]
- [[nixos/security/swapfile-with-luks2|encrypted swap]]
- [[nixos/security/tmp2-auto-unlock-luks2|TPM2 unlock]]
- [[nixos/troubleshooting-bootloader|boot recovery]]

## 📝 notes

all configurations are tested on my personal systems. your mileage may vary depending on hardware and specific requirements.

---

_generated from flake-based configuration_
