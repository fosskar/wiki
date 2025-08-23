* be sure TPM2 is enabled in BIOS

* enable TPM2 in nixos:
<details><summary>{ pkgs, ... }:
{
  boot.kernelModules = [ "uhid" ];

  security.tpm2 = {
    # enable Trusted Platform Module 2 support
    enable = true;

    applyUdevRules = true;

    # enable Trusted Platform 2 userspace resource manager daemon
    # setting this option to true will have TPM2 as a userspace daemon
    # and set the `security.tmp2.tssUser` that the daemon will run as.
    abrmd.enable = true;

    # the TCTI is the "transmission interface" that is used to communicate with a
    # TPM. this option sets TCTI environment variables to the specified values if enabled
    #  - TPM2TOOLS_TCTI
    #  - TPM2_PKCS11_TCTI
    tctiEnvironment.enable = true;

    # enable TPM2 PKCS#11 tool and shared library in system path
    pkcs11.enable = true;
  };

  # utilities to work with TPM2 on linux.
  environment.systemPackages = with pkgs; [
    tpm2-tools
    tpm2-tss
    tpm2-abrmd
  ];
}</summary>

</details>

* identify the LUKS2 partition:
you need to ensure which partition is LUKS encrypted. run:

sudo blkid | grep crypto

or:

sudo lsblk -f

if you have LVM, find your crypted partition.

* enroll the keys:
systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=0+1+2+3+7 <luks2-partition>  # enroll

type in the password for your LUKS2 device

if everything worked you get this notification:
new TPM2 token enrolled as key slot 1.

