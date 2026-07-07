---
title: proxmox zfs mirror setup
description: convert a single-disk proxmox zfs install into a mirror and make both drives bootable
date: 2025-08-20
type: guide
tags: [homelab, proxmox, zfs, storage, boot]
---

this converts a single-disk proxmox install into a mirrored one. the extra boot steps matter because a mirrored zpool alone is not enough if the second disk is not also prepared as a boot target.

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
zpool attach rpool /dev/disk/by-id/nvme-eui.XXXXXXXXXXXXXXXX-part3 /dev/disk/by-id/nvme-CTXXXXXXXXXXXXXX-part3
```

## 5. wait for resilver

```bash
zpool status
```
