---
title: luks2 swapfile hibernate resume on NixOS
description: configure resumeDevice and resume_offset when a swapfile lives inside an unlocked luks2 root filesystem
date: 2024-07-22
type: note
---

if the swapfile lives inside the already-unlocked root filesystem, you do not need a separate encrypted swap device. the important extra bit is hibernate resume: the kernel needs both the unlocked device and the file's physical offset so it can find the image again during early boot.

```nix
# configuration.nix — device and offset are from this setup's machine
swapDevices = [
  {
    device = "/var/swapfile";
    size = 32 * 1024;
  }
];

boot.resumeDevice = "/dev/dm-0";
boot.kernelParams = [
  "resume_offset=372736"
];
```

`/dev/dm-0` is the unlocked luks mapping on this machine; get `resume_offset` from the first `physical_offset` reported by:

```bash
filefrag -v /var/swapfile
```

## related

- [[kwallet-auto-unlock-with-tpm-on-nixos|kwallet auto-unlock with tpm on NixOS]]
- [[tpm2-auto-unlock-for-luks2-on-nixos|tpm2 auto-unlock for luks2 on NixOS]]
