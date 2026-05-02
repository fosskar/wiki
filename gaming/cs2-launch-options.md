---
title: cs2 launch options
description: cs2 launch strings for Steam on AMD/Mesa, with gamescope, MangoHud, vkBasalt, and latency-related flags separated by layer
date: 2024-05-11
type: reference
tags: [gaming, cs2, linux, Wayland, gamescope, performance, amd, mesa]
---

steam launch strings for cs2 on AMD/Mesa with a Wayland desktop.

layer split:

- Wayland: desktop session
- gamescope: nested microcompositor
- MangoHud: direct-launch overlay
- mangoapp: gamescope overlay
- vkBasalt: Vulkan post-processing
- Mesa/RADV variables: driver overrides
- `%command% -vulkan`: cs2 command

## with gamescope

for fixed virtual resolution, ultrawide output, FSR upscaling, fullscreen isolation, or gamescope overlay data.

```bash
MESA_VK_WSI_PRESENT_MODE=immediate RADV_DEBUG=nogpl gamescope \
  --mangoapp \
  -w 1920 -h 1080 \
  -W 3440 -H 1440 \
  -r 165 \
  -f -e --immediate-flips \
  -F fsr \
  -- gamemoderun %command% -vulkan
```

- `gamescope`: nested compositor inside the existing desktop session, not a Wayland alternative
- `--mangoapp`: gamescope overlay path; avoids unsupported `mangohud gamescope ...`
- `-w 1920 -h 1080`: virtual resolution exposed to cs2
- `-W 3440 -H 1440`: gamescope output resolution
- `-r 165`: gamescope refresh/framerate target
- `-f`: fullscreen at launch
- `-e`: Steam integration/overlay handling
- `--immediate-flips`: prefer immediate flips where possible
- `-F fsr`: upscale internal resolution to output resolution
- `gamemoderun`: request GameMode optimisations
- `%command%`: Steam placeholder for the cs2 command
- `-vulkan`: cs2 Vulkan renderer

## without gamescope

for direct launch into the desktop session.

```bash
MESA_VK_WSI_PRESENT_MODE=immediate LD_BIND_NOW=1 ENABLE_VKBASALT=1 mangohud gamemoderun %command% -vulkan
```

- `mangohud`: direct-launch overlay
- `ENABLE_VKBASALT=1`: vkBasalt Vulkan post-processing
- `LD_BIND_NOW=1`: eager dynamic symbol binding; local/experimental knob
- `gamemoderun %command% -vulkan`: GameMode + Steam command + Vulkan renderer

## driver and latency knobs

### `MESA_VK_WSI_PRESENT_MODE=immediate`

Mesa Vulkan WSI present-mode override. `immediate` can reduce presentation waiting, but can also tear or interact badly with compositor/VRR behaviour. test with and without it.

### `RADV_DEBUG=nogpl`

RADV-only workaround knob. disables graphics pipeline library support in Mesa RADV. remove after Mesa or cs2 updates and retest.

### `LD_BIND_NOW=1`

dynamic linker knob. resolves symbols at startup instead of lazily. remove first when direct launch behaves differently after updates.

## overlay and post-processing

### MangoHud / mangoapp

- direct launch: `mangohud gamemoderun %command% -vulkan`
- gamescope: `gamescope --mangoapp -- gamemoderun %command% -vulkan`

normal MangoHud wraps the game process. gamescope needs mangoapp for the compositor wrapper path.

### vkBasalt

`ENABLE_VKBASALT=1` enables Vulkan post-processing. remove it unless the visual filter is intentional.

## debug order

1. remove `LD_BIND_NOW=1`
2. remove `ENABLE_VKBASALT=1`
3. remove `RADV_DEBUG=nogpl`
4. remove `MESA_VK_WSI_PRESENT_MODE=immediate`
5. remove gamescope
6. remove overlays

## references

- [gamescope](https://github.com/ValveSoftware/gamescope)
- [ArchWiki: gamescope](https://wiki.archlinux.org/title/Gamescope)
- [Mesa environment variables](https://docs.mesa3d.org/envvars.html)
- [MangoHud](https://github.com/flightlessmango/MangoHud)
- [GameMode](https://github.com/FeralInteractive/gamemode)
- [vkBasalt](https://github.com/DadSchoorse/vkBasalt)
