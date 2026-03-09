# yubikey gpg/ssh setup guide

comprehensive guide for setting up gpg keys on dual yubikeys for ssh authentication and git signing.

## overview

this setup provides:

- hardware-protected gpg keys stored on yubikey
- ssh authentication without files on disk
- git commit signing with hardware verification
- redundancy with identical keys on two yubikeys
- practical approach focused on real-world threats

### what we accomplished

- ed25519 master key [C] for certifying (no expiry)
- ed25519 signing subkey [S] for git commits (2 year expiry)
- cv25519 encryption subkey [E] for file encryption (2 year expiry)
- ed25519 authentication subkey [A] for ssh access (2 year expiry)
- identical keys on both yubikeys for redundancy
- secure encrypted backup of private keys

## prerequisites

### nixos packages required

add to your nixos configuration:

```nix
# hosts/desktop/security/u2f.nix
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

### fix common gpg issues

fix `gpg.conf` if you get "invalid option" errors:

```bash
# ~/.gnupg/gpg.conf - fix line 11
no_greeting  # wrong
no-greeting  # correct
```

fix pinentry issues in tmux:

```bash
# ~/.gnupg/gpg.conf
echo "pinentry-mode loopback" >> ~/.gnupg/gpg.conf

# ~/.gnupg/gpg-agent.conf
echo "allow-loopback-pinentry" >> ~/.gnupg/gpg-agent.conf

gpgconf --kill gpg-agent
```

## step-by-step setup

### 1. generate master key

```bash
gpg --expert --full-generate-key --pinentry-mode loopback
```

choose:

- 11 (ecc set your own capabilities)
- toggle off sign (s), keep only certify [c]
- q to finish capabilities
- 1 (curve 25519)
- 0 (no expiry for master key)
- your real name and email
- no passphrase (press enter twice)

### 2. add subkeys

```bash
# get key id
export KEYID=$(gpg --list-secret-keys --keyid-format LONG | grep sec | awk '{print $2}' | cut -d'/' -f2)

# edit key to add subkeys
gpg --expert --edit-key --pinentry-mode loopback $KEYID
```

add three subkeys:

#### signing subkey [s]

```
addkey
11 (ecc set capabilities)
a (turn off authenticate)
q (finish - only sign remains)
1 (curve 25519)
2y (2 year expiry)
enter (no passphrase)
y (confirm)
```

#### encryption subkey [e]

```
addkey
12 (ecc encrypt only)
1 (curve 25519)
2y (2 year expiry)
enter (no passphrase)
y (confirm)
```

#### authentication subkey [a] - ssh key

```
addkey
11 (ecc set capabilities)
s (turn off sign)
q (finish - only authenticate remains)
1 (curve 25519)
2y (2 year expiry)
enter (no passphrase)
y (confirm)
```

#### save all changes

```
save
```

### 3. create secure backup

**critical**: backup before moving to yubikey!

```bash
# export all keys (master + subkeys)
gpg --armor --export-secret-keys $KEYID > gpg-master-key.txt

# encrypt backup with strong passphrase
gpg --symmetric --cipher-algo AES256 --output gpg-master-key-backup.gpg gpg-master-key.txt

# delete unencrypted version
shred -u gpg-master-key.txt

# export public key and revocation cert
gpg --armor --export $KEYID > public-key.asc
cp ~/.gnupg/openpgp-revocs.d/$KEYID.rev revocation-cert.asc
```

store `gpg-master-key-backup.gpg` somewhere very safe (password manager, encrypted storage).

### 4. configure yubikey pins

for each yubikey:

```bash
# list yubikeys
ykman list

# set pins (repeat for both serial numbers)
ykman --device SERIAL_NUMBER openpgp access change-pin
# default pin: 123456 → your 6+ digit pin

ykman --device SERIAL_NUMBER openpgp access change-admin-pin
# default admin pin: 12345678 → your 8+ digit admin pin
```

optional: set cardholder name and touch requirements:

```bash
# set name
gpg --card-edit
admin
name
# enter last name, first name
quit

# require physical touch for operations (recommended)
ykman --device SERIAL_NUMBER openpgp keys set-touch sig on
ykman --device SERIAL_NUMBER openpgp keys set-touch aut on
ykman --device SERIAL_NUMBER openpgp keys set-touch dec off
```

### 5. move subkeys to first yubikey

```bash
gpg --pinentry-mode loopback --edit-key $KEYID
```

move each subkey:

```
key 1        # select signing subkey
keytocard    # choose 1 (signature key)
key 1        # deselect
key 2        # select encryption subkey
keytocard    # choose 2 (encryption key)
key 2        # deselect
key 3        # select auth subkey
keytocard    # choose 3 (authentication key)
save         # this deletes subkeys from computer!
```

### 6. setup second yubikey

remove first yubikey, insert second one:

```bash
# delete key stubs pointing to first yubikey
rm -rf ~/.gnupg/private-keys-v1.d/
gpgconf --kill gpg-agent

# restore from backup
gpg --decrypt gpg-master-key-backup.gpg | gpg --import

# move to second yubikey (same process as step 5)
gpg --pinentry-mode loopback --edit-key $KEYID
# repeat key 1/keytocard/key 2/keytocard/key 3/keytocard/save
```

### 7. configure ssh integration

```bash
# export ssh public key
gpg --export-ssh-key $KEYID > ~/.ssh/id_yubikey.pub

# add to shell config (fish example)
# ~/.config/fish/config.fish
set -x SSH_AUTH_SOCK (gpgconf --list-dirs agent-ssh-socket)
set -x GPG_TTY (tty)
gpgconf --launch gpg-agent

# apply for current session
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
export GPG_TTY=$(tty)
```

### 8. configure git signing

```bash
# set git config
git config --global user.signingkey $KEYID
git config --global commit.gpgsign true

# test commit signing
echo "test" > test.txt
git add test.txt
git commit -m "test yubikey signing"
# should prompt for yubikey pin

# verify signature
git log --show-signature -1
```

### 9. add keys to github/servers

#### ssh key

```bash
# copy this to github ssh keys or server authorized_keys
cat ~/.ssh/id_yubikey.pub
```

#### gpg key for verified commits

```bash
# copy this to github gpg keys
gpg --armor --export $KEYID
```

## verification and testing

### verify both yubikeys work

```bash
# test yubikey 1
# insert only first yubikey
gpg --card-status | grep Serial
ssh-add -L  # should show your key
ssh -T git@github.com  # test ssh

# test yubikey 2
# swap yubikeys
gpg --card-status | grep Serial
ssh-add -L  # should show same key
ssh -T git@github.com  # test ssh
```

### verify key structure

```bash
gpg --list-secret-keys --keyid-format LONG
```

should show:

```
sec   ed25519/KEYID [C] (master key, no expiry)
ssb>  ed25519/KEYID [S] (signing subkey, on card)
ssb>  cv25519/KEYID [E] (encryption subkey, on card)
ssb>  ed25519/KEYID [A] (auth subkey, on card)
```

the `>` symbol indicates keys are stored on smartcard.

## daily usage

### pins and authentication

- **user pin** (6+ digits): daily operations (ssh, git signing)
- **admin pin** (8+ digits): administrative operations (changing pins, keys)
- **touch requirement**: physical touch needed if enabled

### common operations

```bash
# list available ssh keys
ssh-add -L

# check which yubikey is active
gpg --card-status | grep Serial

# sign a file
gpg --sign document.txt

# encrypt for yourself
gpg --encrypt --recipient $KEYID file.txt

# decrypt file
gpg --decrypt file.txt.gpg
```

## troubleshooting

### common issues

#### pinentry loops with empty passphrase

```bash
echo "pinentry-mode loopback" >> ~/.gnupg/gpg.conf
echo "allow-loopback-pinentry" >> ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent
```

#### multiple yubikeys detected

```bash
# specify device by serial
ykman --device SERIAL_NUMBER openpgp info
```

#### ssh not using yubikey

```bash
# check ssh agent
echo $SSH_AUTH_SOCK
# should point to: /run/user/1000/gnupg/S.gpg-agent.ssh

# restart gpg agent
gpgconf --kill gpg-agent
gpgconf --launch gpg-agent
```

#### ssh "get_agent_identities: No such file or directory"

this usually means ssh can't connect to the gpg-agent socket:

```bash
# restart gpg agent sockets (nixos way)
systemctl --user restart gpg-agent.socket
systemctl --user restart gpg-agent-ssh.socket

# test connection
ssh-add -L
```

#### ssh config identityagent path issues

avoid hardcoding paths in ssh config. let ssh use SSH_AUTH_SOCK environment variable automatically:

```nix
# don't do this:
# identityAgent = "/home/user/.gnupg/S.gpg-agent.ssh";

# instead: rely on SSH_AUTH_SOCK set by gpg-agent service
programs.ssh = {
  enable = true;
  addKeysToAgent = "no";  # keys are on yubikey, not files
  extraConfig = ''
    StrictHostKeyChecking no
    UpdateHostKeys yes
  '';
};
```

#### "unusable secret key" when moving to second yubikey

backup was made after moving to first yubikey. need to restore from backup made before any keytocard operations.

#### sops-nix configuration for yubikey gpg

ensure gpg key is in pgp section, not age section:

```yaml
# .sops.yaml
keys:
  - &user_yubikey YOUR_GPG_KEY_ID_HERE
  - &host_age age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

creation_rules:
  - path_regex: user/[^/]+\.yaml$
    key_groups:
      - age:
          - *host_age
        pgp:
          - *user_yubikey # gpg key goes in pgp section
```

#### sops shamir threshold issues

if sops requires multiple key groups but you only want to use yubikey:

- put all keys in single key group (either age OR pgp can decrypt)
- or reduce threshold by restructuring key groups

```bash
# convert ssh host key to age format for sops
sudo ssh-to-age -private-key -i /etc/ssh/ssh_host_ed25519_key > ~/.config/sops/age/keys.txt

# or reference directly
SOPS_AGE_KEY_FILE=/path/to/age/key sops secrets.yaml
```

### recovery scenarios

#### lost yubikey

use your backup:

```bash
gpg --decrypt gpg-master-key-backup.gpg | gpg --import
# move to replacement yubikey
```

#### forgotten pin

use admin pin to reset user pin, or use reset code if configured.

#### yubikey completely locked

factory reset yubikey (loses all keys) and restore from backup.

## security considerations

### what this setup protects against

- key theft from compromised computer
- remote attacks (need physical yubikey)
- most real-world threats
- accidental key exposure

### what it doesn't protect against

- physical yubikey theft + pin compromise
- compromised system during key generation
- supply chain attacks on yubikey hardware
- advanced persistent threats during setup

### recommendations

- keep backup encrypted and separate from daily systems
- use different pins for user/admin access
- enable touch requirements for better security
- rotate subkeys every 2 years (keep same master key)
- consider offline key generation for higher threat models

## nixos integration

### home manager ssh configuration

```nix
programs.ssh = {
  enable = true;
  addKeysToAgent = "no";
  matchBlocks = {
    "yubikey-hosts" = {
      host = "*.example.com";
      identityAgent = "${config.home.homeDirectory}/.gnupg/S.gpg-agent.ssh";
    };
  };
};
```

### gpg agent configuration

```nix
services.gpg-agent = {
  enable = true;
  enableSshSupport = true;
  enableFishIntegration = true;
  pinentryPackage = pkgs.pinentry-curses;
  # convenient pin caching - enter pin once per work session
  defaultCacheTtl = 3600;    # 1 hour active cache
  maxCacheTtl = 86400;       # 24 hours maximum
  extraConfig = ''
    allow-loopback-pinentry
  '';
};
```

## advanced topics

### yubikey limitations and alternatives

#### openpgp application constraints

each yubikey openpgp application supports exactly:

- 1 signing subkey [S]
- 1 encryption subkey [E]
- 1 authentication subkey [A] (ssh)

you cannot have multiple signing keys or multiple ssh keys in the same openpgp application.

#### piv smartcard alternative

yubikey also supports piv (personal identity verification) for additional keys:

**piv capabilities:**

- 24 key slots vs openpgp's 3
- x.509 certificates instead of openpgp keys
- can act as certificate authority (ca)
- separate ssh authentication method

**basic piv ssh setup:**

```bash
# generate rsa key in piv slot 9a
ykman piv keys generate 9a /tmp/piv-public.pem --algorithm RSA2048

# create self-signed certificate
ykman piv certificates generate 9a /tmp/piv-public.pem \
  --subject "CN=PIV SSH Key" --valid-days 365

# extract ssh public key
ssh-keygen -D /usr/lib/x86_64-linux-gnu/libykcs11.so -e > ~/.ssh/id_piv.pub

# use for ssh authentication
ssh -I /usr/lib/x86_64-linux-gnu/libykcs11.so user@server
```

**piv as certificate authority:**

```bash
# create root ca in slot 9c
ykman piv keys generate 9c /tmp/ca-public.pem --algorithm RSA4096

# generate self-signed ca certificate
ykman piv certificates generate 9c /tmp/ca-public.pem \
  --subject "CN=Personal Root CA" --valid-days 3650 --ca

# sign certificates for other devices
ykman piv certificates sign 9c server.csr server.crt
```

**use cases for piv:**

- additional ssh keys beyond gpg authentication subkey
- enterprise environments requiring x.509 certificates
- personal pki for homelab/development
- separation of concerns (gpg for development, piv for production)

### integration with other tools

#### git commit signing

after yubikey setup, git automatically uses hardware signing:

```bash
git config --global user.signingkey YOUR_GPG_KEY_ID
git config --global commit.gpgsign true

# commits now prompt for yubikey pin and show verified badges
git commit -m "signed with yubikey"
git log --show-signature -1
```

#### sops-nix integration

yubikey gpg keys work seamlessly with sops-nix:

```bash
# create/edit encrypted secrets (prompts for yubikey pin)
sops secrets.yaml

# nixos automatically decrypts at runtime
# (requires yubikey present during rebuild/boot)
```

## references

- [drduh yubikey guide](https://github.com/drduh/yubikey-guide) - comprehensive but complex
- [arch wiki gpg](https://wiki.archlinux.org/title/GnuPG)
- [yubikey documentation](https://docs.yubico.com/)
- [piv smartcard specification](https://csrc.nist.gov/publications/detail/fips/201/2/final)

---

_created: 2025-08-25_  
_last updated: 2025-08-25_  
_tested on: nixos unstable, yubikey 5 nano/5c nfc_
