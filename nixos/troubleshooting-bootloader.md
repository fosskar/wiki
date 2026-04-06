---
title: bootloader troubleshooting
description: rebuild or reinstall the NixOS bootloader from a running system or a live usb
tags: [nixos, bootloader, troubleshooting]
date: 2024-05-14
---

use this when the bootloader got out of sync with the installed system, the esp was recreated, or the esp simply was not mounted during a rebuild. the fix is not usually magical: make sure the installed system is mounted, then rerun the bootloader install step.

## from a running system

```bash
sudo nixos-rebuild --install-bootloader boot
```

this is enough when the system still boots and you just need fresh boot entries.

## from live media

### mount the installed system

```bash
mount /dev/[root partition] /mnt
mount /dev/[boot partition] /mnt/boot
```

### enter it

```bash
nixos-enter
```

### reinstall the bootloader

```bash
NIXOS_INSTALL_BOOTLOADER=1 /nix/var/nix/profiles/system/bin/switch-to-configuration boot
```

that is the same switch step `nixos-install` would use, just rerun against the already-installed system.
