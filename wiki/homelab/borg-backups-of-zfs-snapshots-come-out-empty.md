---
title: borg backups of zfs snapshots come out empty
description: why a hardened systemd borg job archives empty zfs snapshot directories and how to mount the snapshots so borg sees them
date: 2026-10-11
type: troubleshooting
---

backing up a zfs snapshot instead of the live dataset gives borg a consistent point-in-time view while services keep writing. a remote that only speaks files, such as a Hetzner Storage Box, cannot receive `zfs send`, so the usual pattern is: snapshot in a pre-backup hook, let borg read the snapshot, destroy it in a post-backup hook. on NixOS the borg job is a hardened systemd unit, and two details of that unit decide whether borg sees the snapshot at all.

(this setup) NixOS with OpenZFS 2.4.4, systemd 261, borg 1.4.5; borg jobs from `services.borgbackup.jobs` via clan-core's `borgbackup` service, with `ProtectSystem=strict` and `PrivateTmp=true`; snapshots made by the `snapshot-backup` hooks in nixfiles.

## symptom

- the job finishes with `success`, no errors or warnings
- the archive is far smaller than usual (79 GB instead of 434 GB)
- every zfs folder is in the archive as a single empty directory:

```console
$ borg list --format '{type} {size} {path}{NL}' ::<archive> | grep zfs/snapshot
d 0 tank/apps/immich/.zfs/snapshot/borg-backup
d 0 tank/backup/.zfs/snapshot/borg-backup
```

it may start after a change that adds datasets, e.g. splitting one dataset into one per service.

## cause

there are two separate problems, and both look the same from borg's side.

### the snapshot automount expires

`<dataset>/.zfs/snapshot/<name>` is an automount. the first access makes zfs mount the snapshot, and zfs runs that mount in the host (initial) mount namespace. a mount there propagates into the borg unit's namespace, so a pre-hook that runs `ls` on the path makes the snapshot visible to borg.

but zfs unmounts a snapshot that was not accessed for `zfs_expire_snapshot` seconds (default 300), and that unmount propagates into the borg namespace as well. a process inside the borg unit's own mount namespace cannot trigger the automount again ([openzfs/zfs#3512](https://github.com/openzfs/zfs/issues/3512)). the directory then reads as empty, and borg archives it as such without complaint.

with one big dataset borg reads it continuously, so it never idles long enough. with several datasets, the ones borg reaches late sit untouched while it works through earlier paths, expire, and come out empty. watching it live shows the unmount hit the host and the borg namespace in the same millisecond:

```console
$ findmnt --poll -N <borg-pid> -o ACTION,SOURCE,TARGET
umount  tank/apps/immich@borg-backup  /tank/apps/immich/.zfs/snapshot/borg-backup
```

### a mount from the pre-hook does not reach borg

the obvious fix, an explicit `mount -t zfs -o ro <dataset>@<snapshot> <dir>` in the pre-hook, still gives empty directories. NixOS runs the backup hooks as `ExecStartPre=+` and `borg create` as `ExecStart`. on this setup a mount made by the `ExecStartPre=+` command is not visible to the `ExecStart` process, and never appears on the host either; it is gone when the unit stops. a test from an ssh shell passes, because that shell is in the host namespace. reproduce it in a unit instead:

```console
$ systemd-run --wait --pipe -p ProtectSystem=strict -p PrivateTmp=true \
    -p 'ExecStartPre=+/bin/sh -c "mkdir -p /run/test && mount -t zfs -o ro tank/backup@test /run/test"' \
    sh -c 'grep -c test /proc/mounts'
0
```

## fix

mount the snapshot explicitly, and do it in the host namespace, from which it propagates into the borg unit like the automount did. an explicit mount does not expire.

```bash
# modules/clan-services/snapshot-backup/snapshot-backup.nix, pre-backup hook
inHostNs="nsenter --mount=/proc/1/ns/mnt --"
zfs snapshot "<dataset>@borg-backup"
$inHostNs mkdir -p "/run/snapshot-backup/<dataset>"
$inHostNs mount -t zfs -o ro "<dataset>@borg-backup" "/run/snapshot-backup/<dataset>"
```

give borg the mount with a `/./` in the path:

```text
/run/snapshot-backup/./tank/apps/immich
```

borg 1.4 strips everything left of `/./` from archived paths, so the archive stores `tank/apps/immich/...`, excludes match the live path (`sh:**/tank/apps/immich/encoded-video`), and the fixed path keeps borg's files cache valid between runs.

```bash
# post-backup hook; runs as ExecStopPost=+, so also after a failed job
$inHostNs umount "/run/snapshot-backup/<dataset>"
zfs destroy "<dataset>@borg-backup"
```

the pre-hook should also unmount and destroy a leftover from an interrupted run before it creates a new snapshot.

one more rule: a parent dataset's snapshot shows its child datasets' mount points as empty directories. back up every child as its own folder, or refuse a folder whose dataset has children that are not folders themselves.

borgmatic's zfs hook works the same way (snapshot, temporary mount in its runtime directory, original paths in the archive). it does the mount and runs borg in one process, so it never hits the namespace split.

## verify

after a backup run, count the archived entries per dataset:

```console
$ borg list --format '{path}{NL}' ::<archive> tank | cut -d/ -f1-3 | sort | uniq -c
 108524 tank/apps/immich
  72292 tank/apps/opencloud
   1370 tank/backup
    396 tank/media/music
```

every dataset shows thousands of entries, not `1`, and afterwards `grep -c ' /run/snapshot-backup/' /proc/mounts` returns `0` and `zfs list -t snapshot | grep -c @borg-backup` returns `0`.

## references

- [openzfs/zfs#3512: .zfs/snapshot automount does not work in linux namespace](https://github.com/openzfs/zfs/issues/3512)
- [zfs(4): zfs_expire_snapshot](https://openzfs.github.io/openzfs-docs/man/master/4/zfs.4.html)
- [borgmatic: zfs](https://torsion.org/borgmatic/reference/configuration/data-sources/zfs/)
- [borg create: the /./ slashdot hack](https://borgbackup.readthedocs.io/en/1.4-maint/usage/create.html)
- [snapshot-backup module source](https://github.com/fosskar/nixfiles/tree/main/modules/clan-services/snapshot-backup)

## related

- [[proxmox-zfs-mirror-setup|proxmox zfs mirror setup]]
