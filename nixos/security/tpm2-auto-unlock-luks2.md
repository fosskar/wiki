---
title: tpm2 auto-unlock for luks2
description: enroll a luks2 volume into the machine tpm so boot can unlock it automatically
tags: [nixos, security, tpm, luks]
date: 2024-07-22
---

this is the basic systemd-cryptenroll path: keep the normal luks passphrase, then add a tpm-backed unlock method on top. the tpm only helps if the machine still looks like the one you enrolled, which is why the pcr list matters.

## prerequisites

- tpm2 enabled in bios
- luks2 root device identified first

find the encrypted partition:

```bash
blkid | grep crypto
lsblk -f
```

## nixos support

```nix
{ pkgs, ... }:
{
  boot.kernelModules = [ "uhid" ];

  security.tpm2 = {
    enable = true;
    applyUdevRules = true;
    abrmd.enable = true;
    tctiEnvironment.enable = true;
    pkcs11.enable = true;
  };

  environment.systemPackages = with pkgs; [
    tpm2-tools
    tpm2-tss
    tpm2-abrmd
  ];
}
```

## enroll the luks slot

```bash
systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=0+1+2+3+7 <luks2-partition>
```

enter the existing luks password when prompted.

if it worked, you should see:

```text
new TPM2 token enrolled as key slot 1.
```
