---
title: gpg, ssh, and git signing with yubikey
description: store gpg subkeys on yubikeys, use the auth subkey for ssh, and keep a recovery backup
date: 2025-08-23
type: guide
tags: [security, yubikey, gpg, ssh, git, signing, hardware-token]
---

this setup keeps the offline master key out of daily use, moves the working subkeys onto yubikeys, and lets `gpg-agent` act as the ssh agent. the reason to do it this way is simple: ssh and git signing end up using hardware-backed keys without scattering private key files around the machine.

## key layout

| key          | job                        | where it lives |
| ------------ | -------------------------- | -------------- |
| master `[C]` | certify and manage subkeys | offline backup |
| subkey `[S]` | sign commits and messages  | yubikey        |
| subkey `[E]` | decrypt                    | yubikey        |
| subkey `[A]` | ssh auth                   | yubikey        |

in `gpg -K` output:

- `#` means the private part is not on this machine
- `>` means the private part is on the smartcard

## nixos packages

```nix
environment.systemPackages = with pkgs; [
  yubikey-manager
  yubikey-personalization
  age-plugin-yubikey
  yubioath-flutter
];

services = {
  pcscd.enable = true;
  udev.packages = [ pkgs.yubikey-personalization ];
};

users.users.USERNAME.extraGroups = [ "pcscd" ];
```

## fix common gpg annoyances first

bad option spelling in `~/.gnupg/gpg.conf`:

```text
no_greeting
```

should be:

```text
no-greeting
```

if pinentry is flaky in tmux, allow loopback pinentry and restart the agent:

```bash
echo "pinentry-mode loopback" >> ~/.gnupg/gpg.conf
echo "allow-loopback-pinentry" >> ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

## 1. generate the master key

```bash
gpg --expert --full-generate-key --pinentry-mode loopback
```

choices used here:

- `11` for custom ecc capabilities
- disable sign, keep only certify for the master key
- curve `25519`
- no expiry for the master key
- no passphrase in this flow

the master key stays offline because it is the key that can create new subkeys, extend expiry, and revoke things. losing it is annoying. carrying it around daily is worse.

## 2. add subkeys

```bash
export KEYID=$(gpg --list-secret-keys --keyid-format LONG | grep sec | awk '{print $2}' | cut -d'/' -f2)
gpg --expert --edit-key --pinentry-mode loopback $KEYID
```

create three subkeys:

### signing `[S]`

```text
addkey
11
a
q
1
2y
```

### encryption `[E]`

```text
addkey
12
1
2y
```

### authentication `[A]`

```text
addkey
11
s
q
1
2y
```

save when done:

```text
save
```

## 3. make the backup before `keytocard`

this is the step that matters most. once you move subkeys to a yubikey, the local private copies are gone unless you exported them first.

```bash
gpg --armor --export-secret-keys $KEYID > gpg-master-key.txt
gpg --symmetric --cipher-algo AES256 --output gpg-master-key-backup.gpg gpg-master-key.txt
shred -u gpg-master-key.txt
gpg --armor --export $KEYID > public-key.asc
cp ~/.gnupg/openpgp-revocs.d/$KEYID.rev revocation-cert.asc
```

## 4. set yubikey pins

for each yubikey:

```bash
ykman list
ykman --device SERIAL_NUMBER openpgp access change-pin
ykman --device SERIAL_NUMBER openpgp access change-admin-pin
```

optional touch settings:

```bash
ykman --device SERIAL_NUMBER openpgp keys set-touch sig on
ykman --device SERIAL_NUMBER openpgp keys set-touch aut on
ykman --device SERIAL_NUMBER openpgp keys set-touch dec off
```

## 5. move subkeys to the first yubikey

```bash
gpg --pinentry-mode loopback --edit-key $KEYID
```

inside gpg:

```text
key 1
keytocard
key 1
key 2
keytocard
key 2
key 3
keytocard
save
```

that final `save` is why the backup had to happen first.

## 6. provision the second yubikey

remove the first key, insert the second one, then restore from the backup you made before any `keytocard` action:

```bash
rm -rf ~/.gnupg/private-keys-v1.d/
gpgconf --kill gpg-agent
gpg --decrypt gpg-master-key-backup.gpg | gpg --import
```

then repeat the same `keytocard` sequence for the second yubikey.

## 7. ssh integration

export the ssh public key from the auth subkey:

```bash
gpg --export-ssh-key $KEYID > ~/.ssh/id_yubikey.pub
```

shell env:

```bash
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
export GPG_TTY=$(tty)
```

nixos or home-manager agent config:

```nix
services.gpg-agent = {
  enable = true;
  enableSshSupport = true;
  enableFishIntegration = true;
  pinentryPackage = pkgs.pinentry-curses;
  defaultCacheTtl = 3600;
  maxCacheTtl = 86400;
  extraConfig = ''
    allow-loopback-pinentry
  '';
};
```

avoid hardcoding `identityAgent` paths when `SSH_AUTH_SOCK` already points at the right gpg-agent socket.

## 8. git signing

```bash
git config --global user.signingkey $KEYID
git config --global commit.gpgsign true
```

test it:

```bash
echo "test" > test.txt
git add test.txt
git commit -m "test yubikey signing"
git log --show-signature -1
```

## 9. publish the public keys

ssh:

```bash
cat ~/.ssh/id_yubikey.pub
```

gpg for verified commits:

```bash
gpg --armor --export $KEYID
```

## verify

```bash
gpg --card-status | grep Serial
gpg -K
ssh-add -L
ssh -T git@github.com
```

swap yubikeys and run the same checks again. both devices should expose the same ssh key.

## recovery

### new machine

```bash
gpg --import public-key.asc
gpg --card-status
```

`gpg --card-status` creates the local stubs that point at the yubikey.

### lost or broken yubikey

```bash
gpg --decrypt gpg-master-key-backup.gpg | gpg --import
```

then provision a replacement yubikey with `keytocard`.

### expired subkeys

restore the master key backup on an offline machine, extend expiry or create new subkeys, then re-export the public key.

## common failures

### ssh not using the yubikey

```bash
echo $SSH_AUTH_SOCK
gpgconf --kill gpg-agent
gpgconf --launch gpg-agent
```

### `get_agent_identities: no such file or directory`

```bash
systemctl --user restart gpg-agent.socket
systemctl --user restart gpg-agent-ssh.socket
ssh-add -L
```

### `unusable secret key` on the second yubikey

you backed up after moving keys to the first yubikey. restore from the backup made before any `keytocard` step.

## references

- [drduh yubikey guide](https://github.com/drduh/yubikey-guide)
- [arch wiki gpg](https://wiki.archlinux.org/title/GnuPG)
- [yubikey docs](https://docs.yubico.com/)
