---
title: cs2 launch options
description: cs2 launch strings for gamescope and plain wayland, with short notes on what each flag is doing
tags: [gaming, cs2, nixos]
date: 2024-05-11
---

these are the launch strings worth keeping around. most of the flags exist to control presentation latency, overlays, or wrappers around the game itself.

## gamescope

```bash
MESA_VK_WSI_PRESENT_MODE=immediate RADV_DEBUG=nogpl mangohud gamescope -w 1920 -h 1080 -W 3440 -H 1440 -r 165 -f -e --immediate-flips -F fsr -- gamemoderun %command% -vulkan
```

- `MESA_VK_WSI_PRESENT_MODE=immediate`: asks mesa for immediate present mode
- `RADV_DEBUG=nogpl`: disables radv graphics pipeline library usage
- `mangohud`: enables the overlay
- `gamescope ...`: runs the game inside gamescope with an internal render size, fullscreen output size, refresh rate, immediate flips, and fsr upscaling
- `gamemoderun`: starts the game under gamemode
- `%command%`: steam replaces this with the actual game command
- `-vulkan`: cs2-specific launch arg

## wayland

```bash
MESA_VK_WSI_PRESENT_MODE=immediate LD_BIND_NOW="1" ENABLE_VKBASALT="1" mangohud gamemoderun %command% -vulkan
```

- `LD_BIND_NOW="1"`: resolves bindings at startup instead of lazily later
- `ENABLE_VKBASALT="1"`: enables vkbasalt
- `mangohud`: enables the overlay
- `gamemoderun`: starts the game under gamemode
- `%command%`: steam replaces this with the real command
- `-vulkan`: cs2-specific launch arg

## x11

no x11 launch string noted here yet.
