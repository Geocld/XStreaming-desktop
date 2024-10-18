# XStreaming Steam Deck 指南

> 此部分特别鸣谢`ic58N`、[TigerBeanst](https://github.com/TigerBeanst)

1. 按下 <img src="../../images/steam-deck-button-steam.svg" height=16> 键, 点击 `电源`，再点击 `切换至桌面` 以切换到桌面模式

2. 打开 [AppImageLauncher Github Release](https://github.com/TheAssassin/AppImageLauncher/releases/latest), 下载文件名类似于 `appimagelauncher-lite-xxx-x86_64.AppImage` 的文件

3. 打开 **Dolphin 文件管理器**，导航至 `下载` 文件夹（可以在左侧 `常用位置` 找到，默认路径 `/home/deck/Downloads`，根据实际情况修改，下同），在文件夹内右键，点击 `在此位置打开终端`，此时会弹出 **Konsole**，在其中执行：

```bash
chmod +x appimagelauncher-lite-xxx-x86_64.AppImage
./appimagelauncher-lite-xxx-x86_64.AppImage install
```

> 请自行替换文件名为实际的文件名。你也可以在输入前几个字符后用 `tab` 补全

4. 打开 [XStreaming-desktop Github Release](https://github.com/Geocld/XStreaming-desktop/releases/latest), 下载文件名类似于 `XStreaming-xxx.AppImage` 的文件

5. 回到 **Dolphin 文件管理器**，在下载目录中找到下载的文件，将文件移动到 `/home/deck/Applications`（*建议移动前修改文件名为 `XStreaming.AppImage`，便于版本更新替换*）。稍等片刻后，应该能在 `开始菜单`→`游戏` 中 找到 XStreaming

6. 回到 **Dolphin 文件管理器**，导航至 `/home/deck/.local/share/applications` 目录，<u>你应该能在其中找到 XStreaming 图标，名字以 `appimagekit_` 开头的文件</u>，右键并点击 `Add to Steam`

7. 在桌面模式下，通过 Steam 启动 XStreaming 一次，确保桌面模式下能正常运行。同时在 XStreaming 设置中，开启大屏模式，否则会有上下黑边

8. 回到游戏模式（点击桌面上的 `Return to Gaming Mode`），享受你的远程串流