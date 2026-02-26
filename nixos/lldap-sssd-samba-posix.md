# lldap + sssd + samba (posix ids)

## flow

- `lldap` stores posix attrs (`uidnumber`, `gidnumber`, `homedirectory`, `unixshell`)
- `sssd` reads ldap and exposes users/groups to linux (`getent`, `id`)
- samba uses linux/sssd identity for uid/gid + file permissions
- samba smb passwords are still separate (`tdbsam`) in current setup

## required lldap user fields (custom attrs)

for each samba/linux user, set:

- `uidnumber`: unique linux uid (example `3002`)
- `gidnumber`: primary group gid (example `3030`)
- `homedirectory`: user path (example `/tank/shares/alice`)
- `unixshell`: shell (for samba-only users use `/sbin/nologin`)

normal profile fields (`displayname`, `mail`, etc) are optional for posix identity.

## required lldap group fields

for the shared group:

- group name/cn: `shared`
- `gidnumber`: `3030`
- add users as members

## important rule

user `gidnumber` and group `gidnumber` must match the group you expect.

example bad state:

- user `gidnumber = 3030`
- group `shared.gidnumber = 983`

this causes weird group results in `id`/`getent`.

## samba setup notes (this host)

- per-user shares use `[homes]`
- samba reads the user home path from ldap via `sssd` (`homedirectory`)
- static shared share remains `/tank/shares/shared`
- on first access, home dir can be created via `pam_mkhomedir` (`security.pam.services.samba.makeHomeDir = true`)

## new user checklist

1. create user in lldap
2. set `uidnumber`, `gidnumber`, `homedirectory`, `unixshell`
3. add user to group `shared` (gid `3030`)
4. verify on host: `getent passwd <user>`, `id <user>`
5. add/update samba smb password (separate from lldap password in current setup)

## quick verify commands

```bash
getent passwd <user>
getent group shared
id <user>
```
