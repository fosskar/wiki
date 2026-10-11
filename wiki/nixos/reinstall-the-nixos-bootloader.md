---
title: reinstall the NixOS bootloader
description: rebuild or reinstall the NixOS bootloader from a running system or live usb
date: 2024-05-14
type: troubleshooting
---

## symptom

boot entries are missing or do not match the installed system.

## cause

the bootloader got out of sync with the installed system: the esp was recreated, or it was not mounted during a rebuild.

the fix is the same either way: make sure the installed system is mounted, then rerun the bootloader install step.

## fix from a running system

```bash
sudo nixos-rebuild --install-bootloader boot
```

this is enough when the system still boots and you just need fresh boot entries.

## fix from live media

### mount the installed system

```bash
mount /dev/<root-partition> /mnt
mount /dev/<boot-partition> /mnt/boot
```

### enter it

`nixos-enter` opens a root shell inside the system mounted at `/mnt`:

```bash
nixos-enter
```

### reinstall the bootloader

```bash
NIXOS_INSTALL_BOOTLOADER=1 /nix/var/nix/profiles/system/bin/switch-to-configuration boot
```

that is the same switch step `nixos-install` would use, just rerun against the already-installed system. if it succeeded, reboot from the installed disk — the system should come up normally through its own boot entries.
