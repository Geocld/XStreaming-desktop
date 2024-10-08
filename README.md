<p align="center">
  <a href="https://github.com/Geocld/XStreaming">
    <img src="https://raw.githubusercontent.com/Geocld/XStreaming/main/images/logo.png" width="546">
  </a>
</p>

<p align="center">
  Opensource Xbox Remote Client.
</p>

**English** | [中文](./README.zh_CN.md)

## Intro

XStreaming is an open-source mobile client for xCloud and Xbox home streaming, great inspired by [Greenlight](https://github.com/unknownskl/greenlight).

> DISCLAIMER: XStreaming is not affiliated with Microsoft, Xbox. All rights and trademarks are property of their respective owners.

## Android

If you are looking for an Android Xbox streaming application, you can use [XStreaming](https://github.com/Geocld/XStreaming).

## Features

- Cross platform, support windows/macOS/Linux
- Stream video and audio from the Xbox One and Xbox Series S/X
- Support for 1080P resolution
- Support for OTG\bluetooth gamepad controls
- Support gamepad vibration
- Supports rumble on xCloud without any proxy in some regions.
- IPv6

<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/console.jpg" /> 
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/xcloud.jpg" />
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/xcloud2.jpg" />
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/settings.jpg" />

## steamdeck install

> This section special thanks to `ic58N` and `TigerBeanst`

1. Switch to desktop mode.

2. Go to [AppImageLauncher Github Release](https://github.com/TheAssassin/AppImageLauncher/releases), download appimagelauncher-lite-xxxxxxxxx-x86_64.AppImage (replace with the correct version number), open a terminal and navigate to the directory where the file is located, then execute:

```bash
chmod +x appimagelauncher-lite-xxxxxxxxx-x86_64.AppImage
./appimagelauncher-lite-xxxxxxxxx-x86_64.AppImage install
```

3. Go to [XStreaming-desktop Github Release](https://github.com/Geocld/XStreaming-desktop/releases), download `XStreaming-xxx.AppImage` (replace with the correct version number), place the file in `/home/deck/Applications` (it's recommended to rename it to XStreaming.AppImage for easier version updates), and after a short wait, you should find XStreaming in `Start Menu → Games`.

4. In Dolphin, navigate to `/home/deck/.local/share/applications` to find the XStreaming icon file (the filename might start with `appimagekit_`), right-click and select `Add to Steam`.

5. Launch it once in desktop mode to ensure it runs properly, and enable fullscreen mode in settings (to avoid black bars at the top and bottom).

6. Return to gaming mode to play.

## Local Development

### Requirements
- [NodeJs](https://nodejs.org/) >= 18
- [Yarn](https://yarnpkg.com/) >= 1.22

### Steps to get up and running

Clone the repository:

```
git clone https://github.com/Geocld/XStreaming-desktop
cd XStreaming-desktop
```

Install dependencies:

```
yarn
```

Run development build:

```
npm run dev
```


### License

XStreaming is [MIT licensed](./LICENSE).