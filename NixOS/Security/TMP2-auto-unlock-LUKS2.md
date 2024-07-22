* Be sure tmp2 is enabled in BIOS

* enable tmp2 in nixos:
<details><summary>{ pkgs, ... }:
{
  boot.kernelModules = [ "uhid" ];

  security.tpm2 = {
    # Enable Trusted Platform Module 2 support
    enable = true;

    applyUdevRules = true;

    # Enable Trusted Platform 2 userspace resource manager daemon
    # Setting this option to true will have TMP2 as a userspace daemon
    # and set the `security.tmp2.tssUser` that the daemon will run as.
    abrmd.enable = true;

    # The TCTI is the "Transmission Interface" that is used to communicate with a
    # TPM. this option sets TCTI environment variables to the specified values if enabled
    #  - TPM2TOOLS_TCTI
    #  - TPM2_PKCS11_TCTI
    tctiEnvironment.enable = true;

    # enable TPM2 PKCS#11 tool and shared library in system path
    pkcs11.enable = true;
  };

  # Utilities to work with TPM2 on Linux.
  environment.systemPackages = with pkgs; [
    tpm2-tools
    tpm2-tss
    tpm2-abrmd
  ];
}</summary>

</details>

* Identify the LUKS2 partition:
You need to ensure which partition is LUKS encrypted. Run:

sudo blkid | grep crypto

or:

sudo lsblk -f

if you have LVM, and find you crypted partition.

* Enroll the keys:
systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=0+1+2+3+7 <luks2-partition>  # Enroll

type in the password for your luks2 device

if everything worked you get this notification:
New TPM2 token enrolled as key slot 1.
