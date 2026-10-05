---
title: iPad 插着数据线，Mac 却说"附近没有任何显示器"
date: 2026-10-05 22:05:00
categories:
  - 随笔
tags:
  - macOS
  - Sidecar
  - JXA
  - 私有API
  - 排查
---

晚上十点，iPad 用数据线插在 Mac 上。你打算把它当第二块屏。

打开控制中心，点屏幕镜像——列表里没有它。进系统设置看显示器面板，更不对劲：连「添加显示器」这个按钮都不存在，就好像这台 Mac 根本不认识"外接屏"三个字。

你拔了重插，换了个 USB 口，重启系统设置。

没用。

搜到的答案整齐划一：确认两台设备登录了同一个 Apple ID。你确认了，还是一样。

这篇文章想说的是：**这类问题不该在"设置"里找答案，苹果早就把答案写进日志了。** 而路上那两次翻车，比结论更值得讲。

## 那个面板里根本没有入口

先说卡我最久的一个误会。

我花了不少时间在「系统设置 → 显示器」里找"添加显示器"。翻遍整个面板——每一条文字、每一个按钮——**没有这个东西**。我一度以为是它没加载出来，或者被什么条件挡住了。

后来才明白：macOS 14.5 的这个面板压根不负责添加显示器，随航的入口在控制中心的屏幕镜像菜单里，跟系统设置没有关系。

（顺便，控制中心那块"屏幕镜像"也没有无障碍标签。任何脚本、任何读屏软件看到的都只是一个匿名 button，我翻界面元素才认出它叫 `controlcenter-screen-mirroring`。）

也就是说，我在一个错误的地方，找了一个不存在的按钮。

等副屏连上之后我又回去看了一眼那个面板——还是没有"添加显示器"。它确实从来不在这儿。

## 那就绕开界面，直接问系统

界面不给答案，就问底层。

负责随航的框架叫 `SidecarCore.framework`，躺在 `/System/Library/PrivateFrameworks/` 下面。它是私有的，没有文档，但它是随航的实现本体——控制中心那个按钮按下去，走的也是它。

正常路子是写个 Swift 小程序去调它。我试了，编译失败：CommandLineTools 的 SDK 和编译器版本对不上，一个挺常见的环境损坏。修工具链可以，但没必要——

`osascript` 的 JXA 模式自带 ObjC 桥，可以直接把框架 load 进来，一行都不用编译：

```javascript
ObjC.import("Foundation");

var bundle = $.NSBundle.bundleWithPath(
  "/System/Library/PrivateFrameworks/SidecarCore.framework"
);
bundle.load;

var manager = $.NSClassFromString("SidecarDisplayManager").sharedManager;
var devices = manager.devices;   // ← 关键就这一行
```

跑出来是 0。

系统里一台可达设备都没有。而 iPad 明明插在 USB 上，`system_profiler` 认得到它。

## 答案在日志里，写得很直白

到这一步我才想起去看日志。`rapportd` 是苹果的 Continuity 守护进程，管设备之间的发现和认证：

```
rapportd: Bonjour unauth peer found.
  device: CUBonjourDevice "我的 iPad", TT 0x10 < DirectLink >
rapportd: NULL.skipped.deviceFlag.unauthenticated
```

两行说完了一切。

设备被发现了，走的还是有线（`DirectLink`）。但它是 `unauth`——没认证。于是被 `unauthenticated` 这个标志跳过。

随航要的是已认证的对端，而 Continuity 的认证关系，建立在两台设备属于同一个 iCloud 账号上。账号对不上，设备就在那儿，系统当它不存在。

## 我在这里翻车了两次

故事本该到这儿结束。真正花掉我一晚上的，是"怎么确认账号"。

第一次，我读 `~/Library/Preferences/MobileMeAccounts.plist`：

```
{ "Accounts" => [ ] }
```

空的。再调 Accounts 框架的 `ACAccountStore.accounts`，返回 0。两个来源都指向"没有账号"，于是我把结论写了下来。

然后我在系统设置的侧边栏最上方，看到一行「用户名, Apple ID」。

我立刻改口：账号是登录的，前面判断错了。

**结果这次才是错的。**

那行字就是「用 Apple ID 登录」的入口本身，未登录时它长的就是这副样子。真正定论的是另外两条：

```
brctl status             →  Logged out - iCloud Drive is not configured
Apple ID 面板的窗口标题   →  「登录」
```

回头看，我踩的是同一个坑的两面：`MobileMeAccounts.plist` 在 macOS 14.5 上已经不再被更新，是个化石；`ACAccountStore` 的读取会被隐私权限挡掉，然后静默返回一个空数组——不报错，只说"没有"。

两个看起来最像"事实"的来源，一个过期了，一个被拦住之后学会了撒谎。

## 改完之后

账号统一，我再去看日志，同一台 iPad 那一行变了：

```
DF 0x88 < MyiCloud AirDrop >
```

`MyiCloud` 出现了。设备列表从 0 变成 1。控制中心点一下，iPad 亮起来——`Sidecar Display, 2032 x 1492, 60Hz`。

前后不到三秒。

从"找不到按钮"到"三秒解决"，中间隔着四个字。而它从来没在任何一块设置面板里露过面。

## 几个顺手记下的细节

随航不是投屏。它在系统里注册成一块虚拟显示器（`Connection Type: AirPlay`、`Virtual Device: Yes`），所以你能在显示器排列里拖它、能扩展、能让 Apple Pencil 压感透传。它不是把画面推过去，是把 iPad 变成 Mac 的一块屏。

断了不会自己回来。我实测断开随航，等 20 秒——没有任何自动重连。macOS 的设计就是每次手动选一遍。想要"插上就用"，得自己写个监听。

没有屏幕录制权限时，截图是骗人的。我一度想靠截图看界面，`screencapture` 顺利出图，10MB，细节丰富——但里面只有壁纸和菜单栏，所有窗口都被抹掉了。macOS 未授权时给你的是一张"干净"的假象，而不是一句报错。**它失败的方式，是给你一个看起来成功的答案。**

## 如果你也卡在这里

按这个顺序查，能省一晚上：

1. 先看日志，别急着改设置。`log show --last 10m --predicate 'process == "rapportd"'`，找你的设备名，看它是 `auth` 还是 `unauth`
2. 判账号状态，别信那几个文件。`brctl status` 说 `Logged out` 就是没登录；系统设置最上方显示"登录 Apple ID"而不是你的头像，也是没登录
3. 两台设备都得是同一个账号。只统一一边，等于没改
