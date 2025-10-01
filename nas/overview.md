Homelab/NAS Server Build Summary
Core Hardware
ComponentModel/SpecificationNotesMotherboardASRock Rack X570D4U-2L2T/BCMµATX, server-grade with IPMICPUAMD Ryzen 7 5700X8C/16T, 65W TDPCPU CoolerNoctua NH-D9L110mm height (fits 135mm limit)RAM2× 32GB Samsung DDR4-3200 ECC UDIMM64GB totalPSUSeasonic Focus GX-55080+ Gold, fully modularCaseJMCD 9S29-bay NAS chassis, µATX
Motherboard Key Features

M.2 Slots: 2× PCIe 4.0
SATA Ports: 8× SATA 6Gb/s
Networking: 2× 10GbE (Broadcom BCM57416) + 2× 1GbE (Intel I210-AT)
Management: BMC with IPMI (Aspeed AST2500)
ECC Support: Yes (unofficial but functional with Ryzen non-G CPUs)

Storage Architecture
Pool 1: Boot (rpool)

Drives: 2× Intel Optane M10 16GB Memory
Interface: M.2 NVMe
Configuration: ZFS Mirror
Purpose: Proxmox OS only
Capacity: ~14.9 GiB usable

Pool 2: Flash (VM/Container Storage)

Drives: 2× Kingston DC600M 960GB
Interface: SATA 6Gb/s
Configuration: ZFS Mirror
Purpose: VM disks, container storage, ISOs
Capacity: ~894 GiB usable
Features: TLC NAND, 2GB DRAM cache, PLP, 1 DWPD (1.75 PBW)

Pool 3: Tank (Bulk/Backup Storage)

Drives: 4× WD Red Plus 6TB (WD60EFZX)
Interface: SATA 6Gb/s
Configuration: RAIDZ2
Purpose: Bulk data, media, backups
Capacity: ~11 TiB usable (before ZFS overhead)
Specs: CMR, 5400 rpm, 24/7 rated

Drive Bay Allocation
Bays 1-4Bays 5-8Bay 94× 6TB HDD2× 960GB SSD + 2 spareEmpty
Cooling Setup

Drive Cage: 3× Noctua NF-A9 PWM (92mm) → connected to backplane fan headers
Motherboard Area: 2× Noctua NF-A12x25 G2 PWM (120mm) + 1× NF-A9 PWM (92mm)
Backplane: Temperature-controlled (60% normal, 95% >40°C)

Cabling & Power

Data: 2× SFF-8643 to 4×SATA reverse breakout cables
Power: 3× Molex cables to backplane (distributed across multiple PSU cables)

Software Plan

Hypervisor: Proxmox VE
Storage Management: Proxmox ZFS (direct management, no TrueNAS VM)
Backup Strategy: VMs on flash → backed up to tank pool (vzdump or Proxmox Backup Server)

Power Consumption Estimate (Idle/Typical)
ComponentIdleTypical LoadCPU~30W~45-65WRAM~5W~5WBoot SSDs~0.5W~1WFlash SSDs~2.6W~6WHDDs (4×)~16W~32WFans + Misc~5W~10WTotal~60W~120-150W
Design Philosophy

Separation of concerns: Boot/OS, fast VM storage, bulk data on distinct pools
Reliability: ECC RAM, enterprise SSDs with PLP, ZFS, redundant pools
Performance: NVMe boot (extreme endurance), SATA SSD for VMs (balanced), HDD for capacity
Efficiency: 65W CPU, 5400rpm drives, low-power SSDs, quality PSU
Quiet operation: Noctua fans with PWM curves, 5400rpm drives vs 7200rpm
