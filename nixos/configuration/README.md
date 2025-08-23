---
title: "nixos configuration reference"
description: "comprehensive guide to NixOS system configuration, packages, services, and optimization"
tags: [nixos, configuration, flakes, services, optimization]
date: 2024-04-23
category: configuration
difficulty: intermediate
---

# nixos configuration reference

this section covers everything you need to configure your NixOS system after installation, from basic settings to advanced optimizations.

## 🚀 quick start

### essential configurations
- [[System Settings|basic system configuration]]
- [[User Management|user and group management]]
- [[Package Management|installing and managing packages]]
- [[Services|enabling system services]]

### advanced topics
- [[Desktop Environments|GNOME, KDE, Hyprland setup]]
- [[Graphics Drivers|NVIDIA, AMD, Intel configuration]]
- [[Network Configuration|WiFi, VPN, firewall]]
- [[security|System security]]

## 📁 Configuration Structure

### Basic Layout
```bash
/etc/nixos/
├── configuration.nix      # Main system configuration
├── hardware-configuration.nix  # Auto-generated hardware config
├── flake.nix             # Flake configuration (optional)
├── hosts/                # Multi-host configurations
├── modules/              # Custom modules
└── overlays/             # Package customizations
```bash

### Configuration Files
- `configuration.nix` - Main system configuration
- `hardware-configuration.nix` - Hardware-specific settings (auto-generated)
- `flake.nix` - Modern flake-based configuration
- `home.nix` - User-specific configuration (with home-manager)

## ⚙️ Basic Configuration

### System Information
```nix
{ config, pkgs, ... }:
{
  # Basic system settings
  system.stateVersion = "23.11"; # Don't change after initial install
  
  # Hostname
  networking.hostName = "my-nixos";
  
  # Time zone
  time.timeZone = "America/New_York";
  
  # Locale
  i18n.defaultLocale = "en_US.UTF-8";
  
  # Keyboard layout
  services.xserver.layout = "us";
  console.keyMap = "us";
}
```bash

### User Management
```nix
{
  # Create users
  users.users.alice = {
    isNormalUser = true;
    description = "Alice";
    extraGroups = [ "networkmanager" "wheel" "docker" ];
    packages = with pkgs; [
      firefox
      thunderbird
    ];
  };
  
  # Enable sudo
  security.sudo.wheelNeedsPassword = false;
}
```bash

### Package Management
```nix
{
  # System packages
  environment.systemPackages = with pkgs; [
    vim
    git
    htop
    wget
    curl
    neofetch
  ];
  
  # Allow unfree packages
  nixpkgs.config.allowUnfree = true;
}
```bash

## 🖥️ Desktop Environments

### GNOME
```nix
{
  services.xserver.enable = true;
  services.xserver.displayManager.gdm.enable = true;
  services.xserver.desktopManager.gnome.enable = true;
}
```bash

### KDE Plasma
```nix
{
  services.xserver.enable = true;
  services.xserver.displayManager.sddm.enable = true;
  services.xserver.desktopManager.plasma5.enable = true;
}
```bash

### Hyprland (Wayland)
```nix
{
  programs.hyprland.enable = true;
  programs.hyprland.xwayland.enable = true;
  
  # Required for Wayland
  services.xserver.enable = false;
  services.displayManager = {
    gdm.enable = true;
    wayland = true;
  };
}
```bash

## 🔧 Hardware Configuration

### Graphics Drivers

#### Intel
```nix
{
  services.xserver.videoDrivers = [ "intel" ];
  hardware.opengl = {
    enable = true;
    driSupport = true;
    driSupport32Bit = true;
  };
}
```bash

#### AMD
```nix
{
  services.xserver.videoDrivers = [ "amdgpu" ];
  hardware.opengl = {
    enable = true;
    driSupport = true;
    driSupport32Bit = true;
  };
}
```bash

#### NVIDIA
```nix
{
  services.xserver.videoDrivers = [ "nvidia" ];
  hardware.nvidia = {
    modesetting.enable = true;
    powerManagement.enable = false;
    open = false;
    nvidiaSettings = true;
    package = config.boot.kernelPackages.nvidiaPackages.stable;
  };
}
```bash

### Audio
```nix
{
  sound.enable = true;
  hardware.pulseaudio.enable = false;
  security.rtkit.enable = true;
  services.pipewire = {
    enable = true;
    alsa.enable = true;
    pulse.enable = true;
  };
}
```bash

## 🌐 Network Configuration

### Basic Network
```nix
{
  networking.networkmanager.enable = true;
  networking.useDHCP = false;
  networking.interfaces.enp3s0.useDHCP = true;
}
```bash

### WiFi
```nix
{
  networking.wireless.enable = true;
  networking.wireless.networks = {
    "MyNetwork" = {
      psk = "mypassword";
    };
  };
}
```bash

### VPN (WireGuard)
```nix
{
  networking.wireguard.interfaces = {
    wg0 = {
      ips = [ "10.0.0.2/24" ];
      privateKey = "private-key-here";
      peers = [
        {
          publicKey = "public-key-here";
          allowedIPs = [ "0.0.0.0/0" ];
          endpoint = "vpn.example.com:51820";
        }
      ];
    };
  };
}
```bash

## 🔒 Security Configuration

### Firewall
```nix
{
  networking.firewall.enable = true;
  networking.firewall.allowedTCPPorts = [ 22 80 443 ];
  networking.firewall.allowedUDPPorts = [ 53 ];
}
```bash

### SSH
```nix
{
  services.openssh = {
    enable = true;
    settings = {
      PasswordAuthentication = false;
      PermitRootLogin = "no";
    };
  };
}
```bash

### Automatic Updates
```nix
{
  system.autoUpgrade = {
    enable = true;
    allowReboot = false;
    channel = "https://nixos.org/channels/nixos-unstable";
  };
}
```bash

## 🏠 Home Manager Integration

### Basic Setup
```nix
{
  home-manager.users.alice = { pkgs, ... }: {
    home.packages = with pkgs; [
      alacritty
      neovim
      firefox
    ];
    
    programs.git = {
      enable = true;
      userName = "Alice";
      userEmail = "alice@example.com";
    };
    
    services.gpg-agent = {
      enable = true;
      defaultCacheTtl = 1800;
      enableSshSupport = true;
    };
  };
}
```bash

## 🎯 Performance Optimization

### Kernel Parameters
```nix
{
  boot.kernel.sysctl = {
    "vm.swappiness" = 10;
    "kernel.sched_autogroup_enabled" = 0;
  };
}
```bash

### ZRAM (RAM compression)
```nix
{
  zramSwap.enable = true;
  zramSwap.memoryPercent = 50;
}
```bash

### CPU Governor
```nix
{
  powerManagement.cpuFreqGovernor = lib.mkDefault "performance";
}
```bash

## 📦 Flake Configuration

### Basic flake.nix
```nix
{
  description = "My NixOS configuration";
+
+  inputs = {
+    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
+    home-manager.url = "github:nix-community/home-manager";
+  };
+
+  outputs = { self, nixpkgs, home-manager, ... }@inputs: {
+    nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
+      system = "x86_64-linux";
+      modules = [
+        ./configuration.nix
+        home-manager.nixosModules.home-manager
+      ];
+    };
+  };
+}
```bash

## 🔍 Troubleshooting

### Common Issues

#### "No space left on device"
```bash
# Check disk usage
df -h
+
+# Clean old generations
+nix-collect-garbage -d
+
+# Check store size
+du -sh /nix/store
```bash

#### "Package not found"
+```nix
+# Check if package exists
+nix search nixpkgs package-name
+
+# Enable unfree packages
+nixpkgs.config.allowUnfree = true;
```bash

#### "Service won't start"
+```bash
+# Check service status
+systemctl status service-name
+
+# Check logs
+journalctl -u service-name -f
```bash

## 📝 Next Steps

+- [[nixos/gaming/README|Gaming Configuration]]
+- [[nixos/security/README|security hardening]]
+- [[nixos/troubleshooting/README|Troubleshooting Guide]]
+- [Official NixOS Manual](https://nixos.org/manual/nixos/stable/)

---
+*Configuration examples are tested with NixOS unstable. Adjust for your channel.*

