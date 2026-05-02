---
title: luks2 swapfile hibernate resume on NixOS
description: configure resumeDevice and resume_offset when a swapfile lives inside an unlocked luks2 root filesystem
date: 2024-07-22
type: note
tags: [nixos, security, luks2, swap, hibernate]
---

if the swapfile lives inside the already-unlocked root filesystem, you do not need a separate encrypted swap device. the important extra bit is hibernate resume: the kernel needs both the unlocked device and the file's physical offset so it can find the image again during early boot.

```nix
swapDevices = [
  {
    device = "/var/swapfile";
    size = 32 * 1024;
  }
];

resumeDevice = "/dev/dm-0";
kernelParams = [
  "resume_offset=372736"
];
```

get `resume_offset` from the first `physical_offset` reported by:

```bash
filefrag -v /var/swapfile
```
