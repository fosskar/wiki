---
title: tpm2 auto-unlock for luks2 on NixOS
description: enroll a luks2 volume into the machine tpm and configure the NixOS initrd for automatic boot unlock
date: 2026-07-07
type: guide
---

this is the basic systemd-cryptenroll path: keep the normal luks passphrase, then add a tpm-backed unlock method on top. the tpm only helps if the machine still looks like the one you enrolled, which is why the pcr list matters — and why a firmware update will put you back at the passphrase prompt.

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
# modules/nixos/common/workstation/tpm.nix (this setup)
{ pkgs, ... }:
{
  security.tpm2 = {
    enable = true;
    applyUdevRules = true;
    abrmd.enable = true;
    tctiEnvironment.enable = true;
  };

  environment.systemPackages = with pkgs; [
    tpm2-tools
    tpm2-tss
  ];
}
```

## initrd unlock

enrollment alone does nothing at boot. the initrd has to be systemd-based and told to try the tpm for the luks device:

```nix
boot.initrd.systemd.enable = true;
boot.initrd.systemd.tpm2.enable = true;

boot.initrd.luks.devices.<name>.crypttabExtraOpts = [ "tpm2-device=auto" ];
```

the scripted (non-systemd) initrd cannot do tpm2 unlock; `boot.initrd.systemd.enable` is the switch that makes `systemd-cryptsetup` handle the device.

## enroll the luks slot

```bash
sudo systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=0+1+2+3+7 <luks2-partition>
```

enter the existing luks password when prompted.

pcrs `0`–`3` cover firmware and option roms, `7` covers secure boot state. more pcrs = tighter binding = more re-enrolls after updates.

if it worked, you should see:

```text
new TPM2 token enrolled as key slot 1.
```

## verify

```bash
sudo systemd-cryptenroll <luks2-partition>
```

expected: a slot table listing `password` (slot 0) and `tpm2` (slot 1). then reboot — the volume should open without a passphrase prompt.

## recovery

after a firmware or secure boot change the pcr values no longer match, unlock falls back to the passphrase, and the stale slot needs replacing:

```bash
sudo systemd-cryptenroll --wipe-slot=tpm2 <luks2-partition>
sudo systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=0+1+2+3+7 <luks2-partition>
```

## related

- [[luks2-swapfile-hibernate-resume-on-nixos|luks2 swapfile hibernate resume on NixOS]]
- [[kwallet-auto-unlock-with-tpm-on-nixos|kwallet auto-unlock with tpm on NixOS]]
