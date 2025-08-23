  swapDevices = [
    {
      device = "/var/swapfile";
      size = 32 * 1024;
    }
  ];


    resumeDevice = "/dev/dm-0"; # the unlocked drive mapping
    kernelParams = [
      "resume_offset=372736" # for hibernate resume get with "filefrag -v /var/swapfile" and use first physical_offset
    ];
  };

