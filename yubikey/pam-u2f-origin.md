---
title: pam u2f origin
description: why `pam_u2f` origin and appid need to match between enrollment and login config
tags: [yubikey, pam, u2f, security]
date: 2025-09-04
---

`origin` is the anti-phishing part of u2f. it tells the token which service is asking for authentication. if you enroll a key for one origin and later try to use it with another, auth fails because that mismatch looks exactly like impersonation.

for pam logins, `origin` and `appid` are usually the same value.

## enroll with an explicit origin

```bash
pamu2fcfg -u <username> -o pam://yubikey > u2f_keys
```

if you also want to set `appid` explicitly:

```bash
pamu2fcfg -u <username> -o pam://yubikey -i pam://yubikey > u2f_keys
```

## use the same value in nixos

```nix
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

if those strings do not match exactly, the token will refuse the login.

## control values

- `sufficient`: yubikey can satisfy auth by itself
- `required`: yubikey must succeed alongside other auth
- `requisite`: failure stops auth immediately
- `optional`: success or failure does not decide the final result

## default behavior

if you skip `-o`, `pamu2fcfg` uses `pam://<hostname>`. that ties the enrollment to one machine name, which is usually not what you want for a reusable setup.

## quick checks

- auth fails: compare the `origin` strings first
- no prompt: set `cue = true`
- wrong authfile: make sure the file exists and pam can read it
