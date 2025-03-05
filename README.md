<p align="center">
  <a href="https://github.com/Geocld/XStreaming">
    <img src="https://raw.githubusercontent.com/Geocld/XStreaming/main/images/logo.png" width="546">
  </a>
</p>

<p align="center">
  Open-source Xbox Remote Client.
</p>

**English** | [中文](./README.zh_CN.md)

## Intro

XStreaming is an open-source mobile client for xCloud and Xbox home streaming, great inspired by [Greenlight](https://github.com/unknownskl/greenlight).

> DISCLAIMER: XStreaming is not affiliated with Microsoft, Xbox. All rights and trademarks are property of their respective owners.

## Android

If you are looking for an Android Xbox streaming application, you can use [XStreaming](https://github.com/Geocld/XStreaming).

## Features

- Cross platform, support Windows/macOS/Linux
- Stream video and audio from Xbox One and Xbox Series X|S
- Support for 1080P resolution
- Support for OTG/bluetooth gamepad controls
- Support gamepad vibration
- Supports rumble on xCloud without any proxy in some regions.
- IPv6
- Trigger rumble

<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/console.jpg" /> 
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/xcloud.jpg" />
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/xcloud2.jpg" />
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/settings.jpg" />

## Steam Deck

### Installing from Flathub
`XStreaming` is now available on Flathub. You can directly search for XStreaming in the application store (Discover) in desktop mode on your Steam Deck to install and receive future updates.

[![Build/release](https://flathub.org/assets/badges/flathub-badge-en.svg)](https://flathub.org/apps/io.github.Geocld.XStreamingDesktop)

### Manual Installation
For manual installation, please refer to the [XStreaming Steam Deck Guide](./wiki/steam-deck/README.md)

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
