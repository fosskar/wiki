## gamescope

```shell
MESA_VK_WSI_PRESENT_MODE=immediate RADV_DEBUG=nogpl mangohud gamescope -w 1920 -h 1080 -W 3440 -H 1440 -r 165 -f -e --immediate-flips -F fsr -- gamemoderun %command% -vulkan
```

#### Options explained

`MESA_VK_WSI_PRESENT_MODE=immediate`    ...

`RADV_DEBUG=nogpl`    makes compiling shaders new everytime when startet with this

`mangohud`    activated mangohud overlay

`gamescope -w 1920 -h 1080 -W 3440 -H 1440 -r 165 -f -e --immediate-flips -F fsr --`   starts the game with gamescope and given params

`gamemoderun`   starts the game with gamemode

`%command%`   everything before this got executed before the game starts. commands after that are game specific commands

`-vulkan`    cs2 specific commands


## wayland

```shell
MESA_VK_WSI_PRESENT_MODE=immediate LD_BIND_NOW="1" RADV_TEX_ANISO="0" ENABLE_VKBASALT="1" mangohud gamemoderun %command% -vulkan
```
`LD_BIND_NOW="1"`       binds code on game start

`RADV_TEX_ANISO="0"`    disable anisotropefiltering

`ENABLE_VKBASALT="1"`   enables vkbasalt

`mangohud`              enables manoghud

`gamemoderun`           start with gamemmode

`%command%`   everything before this got executed before the game starts. commands after that are game specific commands

`-vulkan`    cs2 specific commands

## x11
