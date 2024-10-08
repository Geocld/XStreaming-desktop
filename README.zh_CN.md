<p align="center">
  <a href="https://github.com/Geocld/XStreaming">
    <img src="https://raw.githubusercontent.com/Geocld/XStreaming/main/images/logo.png" width="546">
  </a>
</p>

<p align="center">
  开源Xbox/云游戏串流应用.
</p>

## Intro

XStreaming是一款开源的Xbox/云游戏串流移动端客户端，借鉴了[Greenlight](https://github.com/unknownskl/greenlight)提供的API接口和相关实现。

> 声明: XStreaming与Microsoft、Xbox没有关联。所有权和商标属于其各自所有者。

## Android

在Android平台你可以使用 [XStreaming](https://github.com/Geocld/XStreaming)。

## 功能

- 跨平台，支持windows、macOS、Linux
- 串流Xbox One、Xbox Series S/X的音视频
- 支持1080P分辨率
- 支持外接、蓝牙手柄，支持手柄振动
- 支持手柄按键映射
- 免代理云游戏
- IPv6优先连接支持

<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/console.jpg" /> 
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/xcloud.jpg" />
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/xcloud2.jpg" />
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/settings.jpg" />

## steamdeck安装

> 此部分特别鸣谢`ic58N`、[TigerBeanst](https://github.com/TigerBeanst)

1. 切换到桌面模式

2. 前往[AppImageLauncher Github Release](https://github.com/TheAssassin/AppImageLauncher/releases)，下载 `appimagelauncher-lite-xxxxxxxxx-x86_64.AppImage`（自行替换版本号），打开终端并切换到文件所在的目录，依次执行

```bash
chmod +x appimagelauncher-lite-xxxxxxxxx-x86_64.AppImage
./appimagelauncher-lite-xxxxxxxxx-x86_64.AppImage install
```

3. 前往[XStreaming-desktop Github Release](https://github.com/Geocld/XStreaming-desktop/releases)，下载 `XStreaming-xxx.AppImage`（自行替换版本号），把文件放到 `/home/deck/Applications`（建议重命名为XStreaming.AppImage，便于版本更新的时候直接替换），稍等片刻后应该能在 **开始菜单→游戏** 中找到 XStreaming
4. 在 Dolphin 中进入到 `/home/deck/.local/share/applications` 找到 XStreaming 图标样子的文件（文件名可能是以 `appimagekit_` 开头的），右键选择 `Add to Steam`
5. 提前在桌面模式下启动一次确定运行正常，并在设置中开启大屏模式（否则有上下黑边）
6. 返回游戏模式游玩

## 本地开发

### 环境要求
- [NodeJs](https://nodejs.org/) >= 18
- [Yarn](https://yarnpkg.com/) >= 1.22

### 共建计划

欢迎加入[共建计划](https://github.com/Geocld/XStreaming/issues/45)

### 运行项目

克隆本项目到本地:

```
git clone https://github.com/Geocld/XStreaming-desktop
cd XStreaming-desktop
```
安装依赖:

```
yarn
```

启动开发模式:

```
npm run dev
```

### 开源协议

XStreaming 遵循 [MIT 协议](./LICENSE).
