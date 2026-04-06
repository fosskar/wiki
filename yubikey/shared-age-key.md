---
title: "shared age identity across multiple yubikeys"
tags: [yubikey, age, encryption, security]
---

# shared age identity across multiple yubikeys

## problem

`age-plugin-yubikey` generates keys on-device by default. each yubikey gets a unique P-256 key, meaning each has a different age identity/recipient. with multiple yubikeys you end up managing multiple recipients — every secret must be encrypted to all of them.

## solution

generate the P-256 key externally, import the same key + certificate into all yubikeys. same private key = same age recipient = one recipient for all yubikeys.

tradeoff: the private key briefly exists as a file on disk during generation/import.

## how it works

`age-plugin-yubikey` stores two things in a PIV retired slot (82-95):

1. **private key** — P-256 key used for decryption
2. **certificate** — self-signed x509 cert used as metadata:
   - `O=age-plugin-yubikey` — identifies the slot as belonging to the plugin
   - `CN=<name>` — display name
   - `OU=<version>` — plugin version (e.g. `0.5.0`)
   - OID `1.3.6.1.4.1.41482.3.8` — PIN/touch policy (2 bytes: `DER:XX:YY`)

the cert is not used for crypto — only for discovery and policy metadata. the plugin does **not** check certificate expiry.

### policy bytes

| policy | PIN (XX) | touch (YY) |
| ------ | -------- | ---------- |
| never  | 01       | 01         |
| once   | 02       | —          |
| always | 03       | 02         |
| cached | —        | 03         |

touch=cached means a touch is cached for 15 seconds (useful for batch decryption).

**note**: policy is baked into the certificate. since all yubikeys share the same cert, they all have the same PIN/touch policy. different policies per yubikey = different certs = different age identities (defeats the purpose).

## setup

### variables

| variable         | description             | example       |
| ---------------- | ----------------------- | ------------- |
| `<slot>`         | PIV retired slot number | `82` (slot 1) |
| `<pin-policy>`   | PIN policy byte         | `01` (never)  |
| `<touch-policy>` | touch policy byte       | `01` (never)  |
| `<cn-name>`      | certificate common name | `age-key`     |
| `<serial>`       | yubikey serial number   | `29507896`    |

### 1. generate shared key

```bash
mkdir -p ~/age-shared-setup && cd ~/age-shared-setup

# generate P-256 keypair
openssl ecparam -name prime256v1 -genkey -noout -out age-key.pem
openssl ec -in age-key.pem -pubout -out age-key.pub
```

### 2. create certificate

```bash
openssl req -new -x509 -key age-key.pem \
    -subj '/CN=<cn-name>/OU=0.5.0/O=age-plugin-yubikey/' \
    -days 999999 \
    -addext '1.3.6.1.4.1.41482.3.8=DER:<pin-policy>:<touch-policy>' \
    -out age-cert.pem
```

### 3. import to yubikey

> [!important]
> `age-plugin-yubikey` decryption can fail if key policy and cert policy OID mismatch.
> 
> e.g. cert has `DER:01:01` (pin=never,touch=never) but key was imported with default pin=once.
> this causes errors like `failed to decrypt yubikey stanza` even though recipient/key look correct.
> 
> always import key with explicit policy matching the cert OID bytes.

```bash
ykman piv keys import <slot> --pin-policy NEVER --touch-policy NEVER age-key.pem
ykman piv certificates import <slot> age-cert.pem
```

if the slot already has a key, `ykman` will prompt to overwrite.

verify after import:

```bash
ykman piv keys info <slot>
# must match cert oid policy (e.g. never/never for DER:01:01)
```

### 4. verify

```bash
age-plugin-yubikey --list
```

should show the new key with correct name and policies.

### 5. test encrypt/decrypt

```bash
age-plugin-yubikey --identity --serial <serial> --slot 1 > age-identity.txt
echo "test" | age -r <recipient> -o test.age
age -d -i age-identity.txt test.age
```

### 6. import to additional yubikeys

swap yubikeys, repeat step 3 and 4 for each.

### 7. concatenate identity files (optional)

if you use `age -d -i <identity-file>` manually, concatenate identities from all yubikeys so any plugged-in key works without being asked for a specific serial:

```bash
# with each yubikey plugged in:
age-plugin-yubikey --identity --serial <serial-1> --slot 1 > id-yk1.txt
age-plugin-yubikey --identity --serial <serial-2> --slot 1 > id-yk2.txt

cat id-yk1.txt id-yk2.txt > age-identity.txt
```

not needed if your tooling (e.g. sops, clan vars) discovers yubikeys automatically via the plugin.

### 8. backup and cleanup

`age-key.pem` is the only file needed to provision future yubikeys. store it securely (encrypted backup, paper printout, etc.), then delete from disk:

```bash
shred -u age-key.pem age-key.pub
```

## updating secrets/recipients

after replacing a yubikey's age key, existing secrets encrypted to the old recipient must be re-encrypted:

1. add the new recipient to your secrets config
2. re-encrypt all secrets (needs at least one still-valid decryption key — e.g. PGP key on the same yubikey, or another age key)
3. remove the old recipient

the order matters: add new recipient first, re-encrypt, then remove old. you need a working key to decrypt during re-encryption — if you overwrote the age key before re-encrypting, you need another key (PGP, another age key, machine key) that can still decrypt.

## references

- [one age identity, multiple yubikeys](https://pablo.tools/blog/computers/one-age-identity-multiple-yubikeys/)
- [yubico PIV pin/touch policies](https://docs.yubico.com/yesdk/users-manual/application-piv/pin-touch-policies.html)
- [age-plugin-yubikey](https://github.com/str4d/age-plugin-yubikey)
