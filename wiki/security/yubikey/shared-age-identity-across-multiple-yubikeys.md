---
title: shared age identity across multiple yubikeys
description: import the same piv key and certificate into multiple yubikeys so they share one age recipient
date: 2026-02-26
type: guide
tags: [security, yubikey, age, encryption, piv, backup]
---

by default, `age-plugin-yubikey` generates a different key on each device. that means each yubikey gets a different recipient, so every secret has to be encrypted to every key.

if you generate the p-256 key once and import that same key into multiple yubikeys, all of them end up with the same age identity. one recipient, multiple physical keys.

the tradeoff is obvious: the private key exists briefly as a file during setup.

## why the certificate matters

the plugin stores both a private key and a self-signed certificate in a retired piv slot. the cert is metadata, not the crypto key, but the plugin uses it to discover the slot and read pin and touch policy.

fields used here:

- `O=age-plugin-yubikey`
- `CN=<name>`
- `OU=<version>`
- oid `1.3.6.1.4.1.41482.3.8` for pin and touch policy bytes

the plugin does not check cert expiry.

## policy bytes

| policy | pin  | touch |
| ------ | ---- | ----- |
| never  | `01` | `01`  |
| once   | `02` | —     |
| always | `03` | `02`  |
| cached | —    | `03`  |

because the policy lives in the cert, every yubikey sharing this identity also shares the same policy.

## generate the shared key

```bash
mkdir -p ~/age-shared-setup && cd ~/age-shared-setup
openssl ecparam -name prime256v1 -genkey -noout -out age-key.pem
openssl ec -in age-key.pem -pubout -out age-key.pub
```

## create the certificate

important: newer `age-plugin-yubikey` (e.g. `0.5.1`) ignores identities that have unrecognized **critical** cert extensions.
in practice, `openssl req -x509` may add `basicConstraints: critical` via defaults, which breaks identity discovery (`--identity` / `--list` output empty).

use an explicit config so only the needed extensions are present:

```bash
cat > age-cert.cnf <<'EOF'
[req]
distinguished_name = dn
x509_extensions = v3
prompt = no

[dn]
CN = <cn-name>
OU = <version>
O = age-plugin-yubikey

[v3]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
1.3.6.1.4.1.41482.3.8 = DER:<pin-policy>:<touch-policy>
EOF

openssl req -new -x509 -key age-key.pem \
  -config age-cert.cnf -extensions v3 \
  -days 999999 \
  -out age-cert.pem
```

verify cert extensions before import:

```bash
openssl x509 -in age-cert.pem -text -noout | rg -n "Basic Constraints|critical|1.3.6.1.4.1.41482.3.8"
```

you want the policy oid present, and no unsupported critical extensions.

## import to a yubikey

the key import policy has to match the policy bytes baked into the certificate. if they differ, decrypt can fail even though the recipient looks correct.

```bash
ykman piv keys import 82 --pin-policy NEVER --touch-policy NEVER age-key.pem
ykman piv certificates import 82 age-cert.pem
```

verify:

```bash
ykman piv keys info 82
age-plugin-yubikey --list
```

## test it

```bash
age-plugin-yubikey --identity --serial <serial> --slot 1 > age-identity.txt
echo "test" | age -r <recipient> -o test.age
age -d -i age-identity.txt test.age
```

repeat the import and verify steps on the other yubikeys.

## optional combined identity file

if you decrypt manually with `age -d -i`, concatenate the per-device identity files so any inserted yubikey works:

```bash
age-plugin-yubikey --identity --serial <serial-1> --slot 1 > id-yk1.txt
age-plugin-yubikey --identity --serial <serial-2> --slot 1 > id-yk2.txt
cat id-yk1.txt id-yk2.txt > age-identity.txt
```

## backup and cleanup

`age-key.pem` is the important backup. after storing it somewhere safe, remove the local copy:

```bash
shred -u age-key.pem age-key.pub
```

## recipient rotation

if you replace the age key later, add the new recipient first, re-encrypt the secrets, then remove the old recipient. you need at least one still-working decryption key during that migration.

## references

- [one age identity, multiple yubikeys](https://pablo.tools/blog/computers/one-age-identity-multiple-yubikeys/)
- [yubico piv pin/touch policies](https://docs.yubico.com/yesdk/users-manual/application-piv/pin-touch-policies.html)
- [age-plugin-yubikey](https://github.com/str4d/age-plugin-yubikey)
