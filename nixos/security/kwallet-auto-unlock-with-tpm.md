---
title: kwallet auto-unlock via tpm
description: auto-unlock kde kwallet on login with a tpm-sealed password and a small dbus helper
tags: [nixos, kwallet, tpm, security, niri, wayland]
date: 2026-04-06
---

this swaps out gnome-keyring for kwallet and removes the extra password prompt at login. the idea is simple: store the wallet password as a tpm-sealed credential, decrypt it in the user session, derive the hash kwallet expects, then ask `kwalletd6` to unlock the wallet over dbus.

## why this route

- kwallet gives you a secret service implementation without depending on a kde desktop session
- the password stays sealed to the machine tpm instead of being stored in plain text
- no pam glue is needed for the unlock itself

## flow

```text
tpm -> systemd-creds decrypt -> pbkdf2(password, salt) -> dbus pamOpen -> kwalletd6
```

## nixos config

### disable gnome-keyring

if niri or another module enables it by default, force it off so you do not end up with two secret services fighting each other.

```nix
services.gnome.gnome-keyring.enable = lib.mkForce false;
programs.seahorse.enable = lib.mkForce false;
```

### route the secret portal to kwallet

```nix
xdg.portal.config.niri = {
  default = [ "gtk" "gnome" ];
  "org.freedesktop.impl.portal.Secret" = [ "kwallet" ];
};
```

### install kwallet

```nix
environment.systemPackages = [
  pkgs.kdePackages.kwallet
  pkgs.kdePackages.kwalletmanager
];
```

### unlock helper

```python
import hashlib, subprocess, sys, dbus
from pathlib import Path

iterations = 50000
key_size = 56
hash_algo = "sha512"
salt_path = Path.home() / ".local/share/kwalletd/kdewallet.salt"

def main():
    cred_file = Path(sys.argv[1])
    salt = salt_path.read_bytes()

    password = subprocess.run(
        ["systemd-creds", "decrypt", "--user", str(cred_file), "-"],
        capture_output=True, check=True,
    ).stdout.strip()

    password_hash = hashlib.pbkdf2_hmac(hash_algo, password, salt, iterations, key_size)

    bus = dbus.SessionBus()
    proxy = bus.get_object("org.kde.kwalletd6", "/modules/kwalletd6")
    interface = dbus.Interface(proxy, "org.kde.KWallet")
    interface.pamOpen("kdewallet", dbus.ByteArray(password_hash), 0)

if __name__ == "__main__":
    main()
```

### systemd user service

```nix
systemd.user.services.kwallet-tpm-unlock = {
  description = "unlock kwallet using tpm-sealed credentials";
  after = [ "dbus.socket" "graphical-session.target" ];
  wantedBy = [ "graphical-session.target" ];
  serviceConfig = {
    Type = "oneshot";
    ExecStart = "${kwallet-tpm-unlock}/bin/kwallet-tpm-unlock %h/.config/kwallet-tpm/password.cred";
    Restart = "on-failure";
    RestartSec = 2;
    RestartMode = "direct";
  };
};
```

## one-time setup

1. open kwallet once by hand so `~/.local/share/kwalletd/kdewallet.salt` exists
2. seal the wallet password into a user credential

```bash
echo -n 'YOUR_KWALLET_PASSWORD' | systemd-creds encrypt --user - ~/.config/kwallet-tpm/password.cred
```

3. rebuild and reboot

## credits

based on [mic92's dotfiles](https://github.com/Mic92/dotfiles/tree/main/nixosModules/niri/kwallet-tpm) and [autokdewallet](https://github.com/Himalian/autokdewallet).
