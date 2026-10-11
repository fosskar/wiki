---
title: My backup job said success. It had backed up empty directories.
description: a green borg job, an archive of empty zfs folders, and the two systemd and zfs details behind it
date: 2026-10-11
tags: [zfs, borg, nixos, systemd, backup]
---

A backup job's exit code tells you the job ran. It says nothing about whether
your data is in the archive. I learned that from a job that finished green,
in record time, and had backed up four empty directories.

## the symptom

My home server backs up to a Hetzner Storage Box every night at 03:00 with
borg. A small hook snapshots each ZFS dataset first, so borg reads a frozen
copy while the services keep writing. Until then it had worked every night.

The day before, I had split one dataset, `tank/apps`, into one dataset per
service: immich, opencloud, garage. Cleaner snapshots, quotas per app. The next
morning the backup job was green. It had also taken 12 minutes instead of the
usual 16 to 23, and the archive was 79 GB instead of 434. Every ZFS folder was in
there, as exactly one entry:

```text
d 0 tank/apps/immich/.zfs/snapshot/borg-backup
d 0 tank/backup/.zfs/snapshot/borg-backup
```

No error, no warning. Everything outside ZFS was fine.

## first guess: the split broke it

Obvious suspect: the thing I changed yesterday. Except `tank/backup` was in
the backup before the split, wasn't touched by it, and was empty too. The night
before it had 809 entries. So the split could at most make the problem likelier,
not cause it.

## second guess: zfs snapshots don't work inside the service

borg runs in a hardened systemd unit with `ProtectSystem=strict`, which gives
it its own mount namespace. The hook reads snapshots through
`<dataset>/.zfs/snapshot/<name>`, which ZFS mounts on first access. A quick
test confirmed that a process inside such a namespace can't trigger that
automount: the directory just reads as empty. There is even an OpenZFS issue
from 2015 about it.

But the hook triggers the mount on the host, before borg starts, and a longer
test showed the namespace sees that mount fine, even after 400 seconds. So that
alone didn't explain anything either. Which didn't stop me from pushing a fix
built on it, with a confident commit message explaining a cause I hadn't
proven.

## watching instead of guessing

I started a backup by hand and pointed `findmnt --poll` at both the host and
borg's own namespace (`findmnt --poll -N <pid>`), so every mount and unmount of
a snapshot got logged with a timestamp. Most of the run, nothing. Then:

```text
07:02:02.850 host   umount  tank/apps/immich@borg-backup
07:02:02.850 borgns umount  tank/apps/immich@borg-backup
```

Nobody had unmounted anything. ZFS did. It unmounts a snapshot automount once
it hasn't been touched for `zfs_expire_snapshot` seconds, 300 by default, and
the unmount propagates straight into borg's namespace. borg had finished immich
five minutes earlier, so here it didn't matter. But at night borg first spends
several minutes on other paths, and with four datasets instead of one, the ones
it gets to last sit idle long enough to expire. When borg finally reaches them,
it's inside a namespace that can't mount them again. Empty directory, archived,
success.

My 400-second test had simply ended before ZFS got around to it.

## the fix that didn't fix it

So: don't use the automount. Mount each snapshot explicitly, read-only, under
`/run/snapshot-backup/`, in the same pre-backup hook. Explicit mounts don't
expire. I tested it from an SSH shell, it worked, I deployed it, ran a backup,
and got the same empty directories.

The hooks don't run in my SSH shell. NixOS runs them as `ExecStartPre=+` in the
backup unit, and `borg create` as `ExecStart`. A reproduction with
`systemd-run` showed it in two lines:

```text
pre:  mounted=1
main: ns-mounted=0 entries=0
```

The hook's mount existed only for the hook. The main process never saw it, the
host never saw it, and it vanished with the unit. Both processes even reported
the same namespace ID. The old automount had only worked because ZFS performs
it on the host, from where it propagates into the unit.

## the actual fix

Do what the automount did, minus the expiry: create the mount in the host's
namespace.

```bash
nsenter --mount=/proc/1/ns/mnt -- \
  mount -t zfs -o ro "$dataset@borg-backup" "/run/snapshot-backup/$dataset"
```

From there it propagates into borg's namespace and stays until the post-hook
unmounts it. borg gets the path as `/run/snapshot-backup/./tank/apps/immich`;
borg 1.4 strips everything before `/./`, so the archive still stores
`tank/apps/immich/...` and my excludes keep working.

The next run took 34 minutes, archived 440 GB, and had 108,524 entries for
immich instead of one. The full write-up, with the commands to reproduce and
verify, is in the wiki:
[borg backups of zfs snapshots come out empty](/wiki/borg-backups-of-zfs-snapshots-come-out-empty/).

## what I took from it

The bug wasn't really in ZFS or systemd. Both behave as documented. It was in
how I knew the backup worked: the job was green, so I assumed the data was
there. For months that was true by luck of timing.

So now the check is the archive, not the exit code: after a run, count what's
in it per dataset. A folder with one entry where yesterday had a hundred
thousand is a failed backup, whatever the job says. And test where the thing
actually runs. Every test I ran from an SSH shell passed. The ones run as a
systemd unit, in the backup's own conditions, were the ones that told the
truth.
