---
title: "kwallet auto-unlock via tpm"
description: "auto-unlock kde kwallet on login using tpm-sealed credentials over dbus"
tags: [nixos, kwallet, tpm, security, niri, wayland]
date: 2026-04-06
---

# kwallet auto-unlock via tpm

replace gnome-keyring with kde kwallet, auto-unlocked at login using a tpm-sealed password. no manual password entry needed after initial setup.

## why kwallet over gnome-keyring

niri (and niri-flake) default to gnome-keyring. kwallet is a solid alternative if you:

- prefer kde's secret storage
- want tpm-backed auto-unlock without pam integration
- use apps that speak the freedesktop secret service api (browsers, etc.)

## how it works

1. wallet password is encrypted with `systemd-creds` using the tpm chip
2. on graphical session start, a systemd user service decrypts the password
3. derives the pbkdf2 hash using kwallet's salt file
4. calls `kwalletd6` over dbus (`pamOpen`) to unlock the wallet

```
tpm → systemd-creds decrypt → pbkdf2(password, salt) → dbus → kwalletd6
```

## nixos configuration

### disable gnome-keyring

if using niri (nixpkgs module or niri-flake), it sets `gnome-keyring.enable = mkDefault true`. force-disable it:

```nix
services.gnome.gnome-keyring.enable = lib.mkForce false;
programs.seahorse.enable = lib.mkForce false;
```

### portal secret routing

route the freedesktop secret portal to kwallet instead of gnome-keyring:

```nix
xdg.portal.config.niri = {
  default = [ "gtk" "gnome" ];
  "org.freedesktop.impl.portal.Secret" = [ "kwallet" ];
};
```

### kwallet packages

```nix
environment.systemPackages = [
  pkgs.kdePackages.kwallet
  pkgs.kdePackages.kwalletmanager
];
```

### unlock script

python script that decrypts the tpm credential, derives the key, and unlocks via dbus:

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

1. open kwallet once manually so the salt file is created at `~/.local/share/kwalletd/kdewallet.salt`
2. seal your wallet password into the tpm:

```bash
echo -n 'YOUR_KWALLET_PASSWORD' | systemd-creds encrypt --user - ~/.config/kwallet-tpm/password.cred
```

3. rebuild and reboot — wallet unlocks automatically on login

## credits

approach based on [mic92's dotfiles](https://github.com/Mic92/dotfiles/tree/main/nixosModules/niri/kwallet-tpm) and [autokdewallet](https://github.com/Himalian/autokdewallet).
