# XStreaming Steam Deck Guide

**English** | [中文](./README.zh_CN.md)

> This section special thanks to `ic58N` and [TigerBeanst](https://github.com/TigerBeanst)

1. Press the <img src="../../images/steam-deck-button-steam.svg" height=16> button, click `Power` and then click `Switch to Desktop` to switch to Desktop Mode

2. Go to [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher/releases/latest), and download the file with a name similar to `appimagelauncher-lite-xxx-x86_64.AppImage`

3. Open **Dolphin File Manager**, navigate to the Downloads folder (can be found in the left `Places` panel, default path is `/home/deck/Downloads`, modify as needed), right-click within the folder, and select `Open Terminal Here`. This will bring up Konsole, where you should execute:

```bash
chmod +x appimagelauncher-lite-xxxxxxxxx-x86_64.AppImage
./appimagelauncher-lite-xxxxxxxxx-x86_64.AppImage install
```

> Please replace the filename with the actual one. You can also use `tab` to autocomplete after typing the first few characters.

4. Go to [XStreaming-desktop Github Release](https://github.com/Geocld/XStreaming-desktop/releases), download the file with a name similar to `XStreaming-xxx.AppImage`

5. Back to **Dolphin File Manager**, find the downloaded file in the Downloads directory, and move the file to `/home/deck/Applications` (it is recommended to rename the file to `XStreaming.AppImage` before moving, for easier version updates). After a short while, you should find XStreaming in the `Start Menu`→`Games`.

6. In **Dolphin File Manager**, navigate to `/home/deck/.local/share/applications` directory. <u>You should find the XStreaming icon there, with the filename starting with `appimagekit_`</u>. Right-click and select `Add to Steam`.

7. In Desktop Mode, launch XStreaming via Steam once to ensure it runs correctly. Also, enable the **fullscreen mode** in XStreaming settings to avoid black bars on the top and bottom.

8. Return to Gaming Mode (click `Return to Gaming Mode` on the desktop) and enjoy your remote streaming.