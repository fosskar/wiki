---
title: "Complete NixOS Installation Guide"
description: "Step-by-step guide for installing NixOS with LUKS encryption, flake setup, and post-install configuration"
tags: [nixos, installation, luks, encryption, flake, setup]
date: 2024-04-23
category: installation
difficulty: intermediate
estimated-time: "2-3 hours"
---

# Complete NixOS Installation Guide

This guide provides a comprehensive walkthrough for installing NixOS with full disk encryption (LUKS), flake configuration, and essential post-install setup.

## 📋 Prerequisites

### Required
- USB drive (8GB+)
- Internet connection
- 64-bit UEFI system
- 20GB+ free disk space

### Optional but Recommended
- Backup of important data
- Wired internet connection (more reliable than WiFi)
- External monitor (for troubleshooting)

## 🚀 Quick Navigation

| Section | Time | Difficulty |
|---------|------|------------|
| [Live USB Setup](#live-usb-setup) | 15 min | Easy |
| [Partitioning](#partitioning) | 30 min | Medium |
| [Installation](#installation) | 45 min | Medium |
| [Post-Install](#post-install-setup) | 30 min | Easy |

---

## 1. Live USB Setup

### Download NixOS
```bash
# Latest stable image
wget https://channels.nixos.org/nixos-23.11/latest-nixos-gnome-x86_64-linux.iso

# Or latest unstable
wget https://channels.nixos.org/nixos-unstable/latest-nixos-gnome-x86_64-linux.iso
```bash

### Create Bootable USB
```bash
# Linux/macOS
sudo dd if=latest-nixos-gnome-x86_64-linux.iso of=/dev/sdX bs=4M status=progress

# Windows (use Rufus or balenaEtcher)
```bash

### Boot from USB
1. Insert USB and reboot
2. Enter BIOS/UEFI boot menu (usually F12, F2, or Del)
3. Select USB drive
4. Choose "NixOS GNOME" (or your downloaded variant)

---

## 2. Partitioning

> ⚠️ **Warning**: This will erase all data on the selected disk!

### Identify Your Disk
```bash
# List all disks
lsblk

# Check disk size and model
lsblk -o NAME,SIZE,MODEL,SERIAL
```bash

### Partition Scheme (UEFI with LUKS)

| Partition | Size | Type | Purpose |
|-----------|------|------|---------|
| `/dev/nvme0n1p1` | 512MB | FAT32 | EFI System Partition (ESP) |
| `/dev/nvme0n1p2` | Rest | LUKS | Encrypted root partition |

### Automated Partitioning Script
```bash
#!/bin/bash
DISK="/dev/nvme0n1"

# Wipe disk
sudo wipefs -a $DISK

# Create GPT partition table
sudo parted $DISK -- mklabel gpt

# Create EFI partition
sudo parted $DISK -- mkpart ESP fat32 1MB 512MB
sudo parted $DISK -- set 1 esp on

# Create root partition
sudo parted $DISK -- mkpart root ext4 512MB 100%
```bash

---

## 3. Encryption Setup

### Format with LUKS
```bash
# Encrypt root partition
sudo cryptsetup luksFormat /dev/nvme0n1p2

# Open encrypted partition
sudo cryptsetup luksOpen /dev/nvme0n1p2 nixos-enc

# Verify it's open
ls /dev/mapper/
```bash

### Format Partitions
```bash
# Format EFI partition
sudo mkfs.fat -F 32 -n BOOT /dev/nvme0n1p1

# Format encrypted root
sudo mkfs.ext4 -L nixos /dev/mapper/nixos-enc
```bash

---

## 4. Mount and Configure

### Mount Partitions
```bash
# Mount root
sudo mount /dev/disk/by-label/nixos /mnt

# Create and mount boot
sudo mkdir -p /mnt/boot
sudo mount /dev/disk/by-label/BOOT /mnt/boot

# Verify mounts
df -h
```bash

### Generate Base Configuration
```bash
sudo nixos-generate-config --root /mnt
```bash

---

## 5. Configuration Files

### Edit Configuration
```bash
sudo nano /mnt/etc/nixos/configuration.nix
```bash

### Basic Configuration Template
```nix
{ config, pkgs, ... }:

{
  imports = [
    ./hardware-configuration.nix
  ];

  # Boot configuration
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # LUKS configuration
  boot.initrd.luks.devices = {
    nixos-enc = {
      device = "/dev/disk/by-uuid/YOUR-UUID-HERE";
      preLVM = true;
      allowDiscards = true;
    };
  };

  # Networking
  networking.hostName = "nixos";
  networking.networkmanager.enable = true;

  # Time and locale
  time.timeZone = "America/New_York";
  i18n.defaultLocale = "en_US.UTF-8";

  # User configuration
  users.users.youruser = {
    isNormalUser = true;
    description = "Your Name";
    extraGroups = [ "networkmanager" "wheel" ];
    packages = with pkgs; [
      vim
      git
    ];
  };

  # Enable flakes
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  # System packages
  environment.systemPackages = with pkgs; [
    vim
    wget
    curl
    git
  ];
}
```bash

---

## 6. Installation

### Install System
```bash
sudo nixos-install
```bash

### Set Root Password
```bash
# You'll be prompted to set root password
sudo nixos-install
```bash

### Reboot
```bash
sudo reboot
```bash

---

## 7. Post-Install Setup

### First Boot Checklist

#### ✅ System Verification
```bash
# Check disk encryption
sudo cryptsetup luksDump /dev/nvme0n1p2

# Verify mounts
df -h
lsblk

# Check network
ping google.com
```bash

#### ✅ Update System
```bash
# Update channel
sudo nix-channel --update

# Rebuild with latest packages
sudo nixos-rebuild switch --upgrade
```bash

#### ✅ Add User
```bash
# Switch to root
sudo -i

# Add user
useradd -m -G wheel yourusername
passwd yourusername
```bash

#### ✅ Enable Flakes (if not already)
```bash
# Add to configuration.nix
nix.settings.experimental-features = [ "nix-command" "flakes" ];

# Rebuild
sudo nixos-rebuild switch
```bash

---

## 8. Flake Setup (Advanced)

### Initialize Flake
```bash
# Create flake directory
mkdir -p ~/nixos-config
cd ~/nixos-config

# Initialize flake
nix flake init -t nixos
```bash

### Basic flake.nix
```nix
{
  description = "My NixOS configuration";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    home-manager.url = "github:nix-community/home-manager";
  };

  outputs = { self, nixpkgs, home-manager, ... }@inputs: {
    nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        ./configuration.nix
        home-manager.nixosModules.home-manager
      ];
    };
  };
}
```bash

### Apply Flake Configuration
```bash
sudo nixos-rebuild switch --flake ~/nixos-config#nixos
```bash

---

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **"No space left on device"** | Check `/boot` partition size (needs 512MB+) |
| **"Device not found"** | Verify UUID in configuration matches actual device |
| **"Failed to open LUKS device"** | Check password and device path |
| **Network not working** | Enable NetworkManager: `networking.networkmanager.enable = true` |

### Recovery Mode
If system fails to boot:
1. Boot from USB again
2. Mount encrypted partition: `cryptsetup luksOpen /dev/nvme0n1p2 nixos-enc`
3. Mount system: `mount /dev/mapper/nixos-enc /mnt`
4. Fix configuration and rebuild: `nixos-enter && nixos-rebuild switch`

---

## 📚 Additional Resources

- [[NixOS/Configuration/Advanced|Advanced Configuration]]
- [[NixOS/Security/README|Security Hardening]]
- [[NixOS/Gaming/README|Gaming Setup]]
- [Official NixOS Manual](https://nixos.org/manual/nixos/stable/)
- [NixOS Wiki](https://nixos.wiki/)

---

*Next: [[NixOS/Configuration/README|Configure Your System]]*

