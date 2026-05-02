---
title: samba posix identity with lldap and sssd
description: use lldap posix attributes as linux identities for samba shares through sssd while keeping smb passwords in tdbsam
date: 2026-02-26
type: guide
tags: [homelab, identity, lldap, sssd, samba, posix, linux, nixos]
---

## model

```text
lldap custom attributes -> sssd nss -> linux uid/gid/home/shell -> samba file access
                                                     \
                                                      -> samba tdbsam password
```

`lldap` stores the POSIX identity data. `sssd` exposes that data through NSS. `samba` maps SMB sessions to the resulting linux user and group.

`tdbsam` stays separate. LLDAP password verification and Samba SMB password verification use different secrets.

## ldap attributes

use the attribute names that `sssd` is configured to read. default SSSD LDAP mappings use `uidNumber`, `gidNumber`, `homeDirectory`, and `loginShell`; lowercase custom names require matching SSSD mapping.

user attributes:

| attribute | value |
| --- | --- |
| `uidnumber` | unique linux uid |
| `gidnumber` | primary linux gid |
| `homedirectory` | unix home path used by `[homes]` |
| `unixshell` | login shell; `/sbin/nologin` for SMB-only accounts |

group attributes:

| attribute | value |
| --- | --- |
| `cn` | group name |
| `gidnumber` | linux gid |
| membership | users assigned to the group in LLDAP |

## invariants

- every `uidnumber` is unique
- every `gidnumber` used by a user exists on a group
- user `gidnumber` equals the intended primary group `gidnumber`
- shared filesystem paths use the same gid that LLDAP exposes through `sssd`
- `homedirectory` points at the path Samba exposes through `[homes]`
- SMB-only users use a non-login shell such as `/sbin/nologin`

## samba boundary

Samba needs a linux identity and an SMB password entry.

`sssd` supplies the linux identity:

```bash
getent passwd <user>
id <user>
```

Samba supplies the SMB password entry:

```bash
sudo smbpasswd -a <user>
```

`smbpasswd -a` requires the user to exist through NSS first. If `getent passwd <user>` fails, the Samba password entry cannot be added cleanly.

## why lldap userPassword is not the SMB password

Samba can use LDAP for SMB accounts. `passdb backend = ldapsam` stores Samba account data in LDAP instead of `tdbsam`.

that does not mean generic LDAP `userPassword` is enough:

- SMB/NTLM authentication is not a normal LDAP bind
- Samba passdb needs Samba account attributes and NT/LM password hashes
- `ldapsam` expects a Samba-compatible LDAP schema and writable Samba account records
- `ldap passwd sync` can sync LDAP passwords with NT/LM hashes during Samba password changes
- LLDAP does not expose reusable password hashes
- LLDAP documents Windows/Samba integration as WIP

SSSD does not change that boundary. SSSD exposes identity through NSS/PAM; `smbd` still verifies SMB authentication through its passdb backend.

`getent passwd <user>` and `id <user>` prove identity lookup. `pdbedit -L` proves SMB password state.

LLDAP + SSSD + `tdbsam` is identity sharing, not password sharing. single-password setups need Samba AD DC, external AD/kerberos with winbind, or `ldapsam` against an LDAP server that supports Samba schema and NT hash attributes.

`[homes]` uses the home directory from the linux identity. shared folders use filesystem ownership and mode bits from the resolved uid/gid.

NixOS home creation for Samba logins:

```nix
security.pam.services.samba.makeHomeDir = true;
```

same mechanism elsewhere: enable `pam_mkhomedir` for the Samba PAM service.

## verify

linux identity:

```bash
getent passwd <user>
getent group <group>
id <user>
```

Samba passdb:

```bash
pdbedit -L | grep '^<user>:'
```

expected split:

- `getent passwd <user>` shows uid, gid, home, shell from SSSD
- `id <user>` shows primary and supplementary groups from SSSD
- `pdbedit -L` shows the separate SMB password account

## failure modes

### `smbpasswd -a <user>` fails

missing linux identity. fix `sssd` lookup first:

```bash
getent passwd <user>
```

### `id <user>` shows the wrong primary group

user `gidnumber` points at the wrong group gid, or the group has the wrong `gidnumber`.

### `[homes]` opens the wrong path

wrong `homedirectory` value or stale SSSD cache.

### SMB auth fails but `id <user>` works

missing, disabled, or outdated Samba passdb entry. update `tdbsam`:

```bash
sudo smbpasswd -a <user>
pdbedit -L | grep '^<user>:'
```

### file permissions look numeric or wrong

uid/gid mismatch between LLDAP attributes and existing filesystem ownership.

## references

- [LLDAP](https://github.com/lldap/lldap)
- [sssd-ldap(5)](https://www.mankier.com/5/sssd-ldap)
- [sssd-ldap-attributes(5)](https://www.mankier.com/5/sssd-ldap-attributes)
- [smb.conf(5): passdb backend](https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html#PASSDBBACKEND)
- [smbpasswd(8)](https://www.samba.org/samba/docs/current/man-html/smbpasswd.8.html)
- [pdbedit(8)](https://www.samba.org/samba/docs/current/man-html/pdbedit.8.html)
