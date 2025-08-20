# proxmox zfs raid1 setup

convert single drive zfs setup to mirrored raid1 with full boot redundancy.

## step 1: copy partition structure and randomize guids

copy the partition layout from your 1tb drive (nvme1n1) to your 2tb drive (nvme0n1):

```bash
sgdisk /dev/nvme1n1 -R /dev/nvme0n1
```bash

randomize the guids on the new 2tb drive to prevent conflicts:

```bash
sgdisk -G /dev/nvme0n1
```bash

## step 2: fix the size of the zfs partition

delete the small p3 on the new drive and create a new, larger p3 that fills the rest of the disk:

```bash
# delete the incorrectly-sized partition 3 on the new 2tb drive
sgdisk -d 3 /dev/nvme0n1

# create a new partition 3 that starts at the next available sector (0) and fills the rest of the disk (0)
sgdisk -n 3:0:0 /dev/nvme0n1

# set the correct partition type for zfs ('bf01') on the new partition 3
sgdisk -t 3:BF01 /dev/nvme0n1
```bash

**parameter explanation:**
- `-n 3:0:0`: create new partition number 3. 0 for the start sector means "use the next available one". 0 for the end sector means "use the rest of the disk"
- `-t 3:BF01`: set the type of partition 3 to bf01, which is the code for "solaris / illumos / zfs"

## step 3: make the second drive bootable

format the efi boot partition (partition 2) on the new 2tb drive:

```bash
proxmox-boot-tool format /dev/nvme0n1p2 --force
```bash

initialize the new efi partition, making it a boot target for proxmox:

```bash
proxmox-boot-tool init /dev/nvme0n1p2
```bash

## step 4: attach the correctly sized partition to the pool

attach the zfs data partition (partition 3) of the new drive to your rpool mirror:

```bash
zpool attach rpool /dev/disk/by-id/nvme-eui.002538b731b3c330-part3 /dev/disk/by-id/nvme-CT2000P3PSSD8_25094E7C8658-part3
```bash

## step 5: monitor and verify

monitor the progress until the resilver is complete:

```bash
zpool status
```bash

