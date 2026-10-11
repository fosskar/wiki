---
title: pam u2f origin and appid
description: why pam_u2f origin and appid must match between enrollment and login configuration
date: 2025-09-04
type: troubleshooting
---

## symptom

a yubikey enrolled with `pamu2fcfg` refuses the login.

## cause

`origin` is the anti-phishing part of u2f. it tells the token which service is asking for authentication. if you enroll a key for one origin and later try to use it with another, auth fails because that mismatch looks exactly like impersonation.

for pam logins, `origin` and `appid` are usually the same value.

if you skip `-o`, `pamu2fcfg` uses `pam://<hostname>`. that ties the enrollment to one machine name, which is usually not what you want for a reusable setup.

## fix

pick one explicit value and use it in both places: at enrollment and in the pam config.

### enroll with an explicit origin

```bash
pamu2fcfg -u <username> -o pam://yubikey > u2f_keys
```

if you also want to set `appid` explicitly:

```bash
pamu2fcfg -u <username> -o pam://yubikey -i pam://yubikey > u2f_keys
```

without an `authfile` setting, pam-u2f reads `~/.config/Yubico/u2f_keys` (`$XDG_CONFIG_HOME/Yubico/u2f_keys` if that is set), so move the file there or point `settings.authfile` at it.

### use the same value in nixos

```nix
# configuration.nix (this setup: modules/nixos/hardware/yubikey/u2f.nix)
security.pam = {
  u2f = {
    enable = true;
    control = "sufficient";
    settings = {
      origin = "pam://yubikey";
      appid = "pam://yubikey";
      cue = true;
    };
  };
};
```

if `origin` and `appid` here do not match the values used at enrollment exactly, the token refuses the login.

## quick checks

- auth fails: compare the `origin` strings first
- no prompt: set `cue = true`
- wrong authfile: make sure the file exists and pam can read it

## control values

`control` decides how the u2f result combines with the rest of the pam stack:

- `sufficient`: yubikey can satisfy auth by itself
- `required`: yubikey must succeed alongside other auth
- `requisite`: failure stops auth immediately
- `optional`: success or failure does not decide the final result

## related

- [[gpg-ssh-and-git-signing-with-yubikey|gpg, ssh, and git signing with yubikey]]
- [[shared-age-identity-across-multiple-yubikeys|shared age identity across multiple yubikeys]]
