# bootloader

* something happened, and the bootloader doesn't work as expected. for example BIOS update.
* the ESP was re-made and nothing was kept.
* the ESP wasn't mounted and I want to re-generate the menu entries.

## from a running system

```shell
sudo nixos-rebuild --install-bootloader boot
```

## from an installation media

### boot live USB and mount

booting from the installation media, mount the root partition under /mnt and the boot partition under /mnt/boot.

```shell
mount /dev/[root partition] /mnt
mount /dev/[boot partition] /mnt/boot
```

### nixos-enter

next, enter the installed system with nixos-enter, or by manually binding the virtual filesystems and then calling chroot.

```shell
nixos-enter
```

### re-install bootloader

 finally, run the [command that the installer would run](https://github.com/NixOS/nixpkgs/blob/e140d71d6330786c40b4bd9c0d59af7ad1a5e86a/nixos/modules/installer/tools/nixos-install.sh#L191-L192). this will re-install the bootloader.

```shell
NIXOS_INSTALL_BOOTLOADER=1 /nix/var/nix/profiles/system/bin/switch-to-configuration boot
```

