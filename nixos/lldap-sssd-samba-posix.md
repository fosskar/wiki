---
title: lldap + sssd + samba
description: how lldap posix attributes feed sssd and then samba on this host
tags: [nixos, ldap, sssd, samba]
date: 2026-02-26
---

the important part here is the identity chain:

- `lldap` stores posix attributes
- `sssd` exposes them to linux through `getent` and `id`
- samba then uses that linux identity for uid, gid, and filesystem permissions

samba passwords are still separate in this setup and live in `tdbsam`.

## required user attributes

for each linux or samba user, set:

- `uidnumber`: unique linux uid, for example `3002`
- `gidnumber`: primary group gid, for example `3030`
- `homedirectory`: for example `/tank/shares/alice`
- `unixshell`: for samba-only users, `/sbin/nologin`

normal profile fields like `displayname` or `mail` are optional for posix identity.

## required group attributes

for the shared group:

- group name or `cn`: `shared`
- `gidnumber`: `3030`
- add the users as members

## easy mistake

user `gidnumber` and group `gidnumber` need to agree. if the user points at `3030` but the `shared` group has `983`, `id` and `getent` will look wrong because linux is being told two different stories.

## samba notes for this host

- per-user shares use `[homes]`
- samba gets the home path through `sssd` from `homedirectory`
- the shared share stays at `/tank/shares/shared`
- first login can create the home directory through `pam_mkhomedir` with `security.pam.services.samba.makeHomeDir = true`

## new user checklist

1. create the user in lldap
2. set `uidnumber`, `gidnumber`, `homedirectory`, `unixshell`
3. add the user to `shared`
4. verify on the host
5. add or update the separate samba password

## verify

```bash
getent passwd <user>
getent group shared
id <user>
```
