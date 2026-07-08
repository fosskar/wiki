---
title: proxmox zfs mirror setup
description: convert a single-disk proxmox zfs install into a mirror and make both drives bootable
date: 2025-08-20
type: guide
---

this converts a single-disk proxmox install into a mirrored one. the extra boot steps matter because a mirrored zpool alone is not enough if the second disk is not also prepared as a boot target. in this setup `/dev/nvme1n1` is the existing disk and `/dev/nvme0n1` the new one — swap them to match yours.

## 1. copy the partition table

```bash
sgdisk /dev/nvme1n1 -R /dev/nvme0n1
sgdisk -G /dev/nvme0n1
```

`-R` clones the source layout. `-G` randomizes guids on the new disk so both drives do not present the same partition ids.

## 2. grow the zfs partition on the new disk

```bash
sgdisk -d 3 /dev/nvme0n1
sgdisk -n 3:0:0 /dev/nvme0n1
sgdisk -t 3:BF01 /dev/nvme0n1
```

- `-n 3:0:0`: recreate partition 3 using the next free sector through the end of the disk
- `-t 3:BF01`: mark it as a zfs partition

## 3. make the second disk bootable

```bash
proxmox-boot-tool format /dev/nvme0n1p2 --force
proxmox-boot-tool init /dev/nvme0n1p2
```

## 4. attach it to the pool

```bash
zpool attach rpool /dev/disk/by-id/<existing-disk-id>-part3 /dev/disk/by-id/<new-disk-id>-part3
```

use the stable `/dev/disk/by-id/` names (`ls -l /dev/disk/by-id/ | grep nvme`), not the `nvme0n1` device nodes — those can swap between boots.

## verify

```bash
zpool status rpool
```

expected: `mirror-0` with both `-part3` devices listed and pool state `ONLINE` once the resilver finishes. also check `proxmox-boot-tool status` lists both esp partitions as boot targets.
