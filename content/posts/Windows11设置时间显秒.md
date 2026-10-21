---
title: Windows11设置时间显秒
date: 2023-05-17 13:59:15
category: Windows
tags: Windows
index_img: /img/default.png
banner_img:
---

## 前置条件
1. 电脑系统为`Windows11` `22621.1555`或以上（我所使用的Windows11版本）
2. 已经安装`2023-适用于 Windows 11 Version 22H2 的 05 累积更新，适合基于 x64 的系统`，补丁号为`KB5026372`

## 通过添加注册表开启支持
1. 按下 `Win+R`，输入 `regedit` 打开注册表编辑器;
2. 然后定位到 `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced`
3. 右键点击`Advanced`文件夹后选择 `新建-DWORD（32 位）值`,并将其重命名为`ShowSecondsInSystemClock`,左键双击`ShowSecondsInSystemClock`,将值改为`1`即可生效。

**若未生效，可尝试检查前置条件：若满足则重启资源管理器；若不满足则更新到对应版本或补丁** 

*`Windows11`是首次在`dev`的`25247`中引入任务栏托盘读秒*
**通过加入`Windows`预览体验计划，更新到最新，你会发现设置里面可以选择秒数……(在系统托盘时钟中显示秒数（使用更多电力）)**
