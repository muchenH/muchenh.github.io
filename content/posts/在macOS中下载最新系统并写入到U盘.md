---
title: 在macOS中下载最新系统并写入到U盘
date: 2022-10-24 22:09:45
category: macOS
tags: macOS
index_img: /img/default.png
banner_img:

---

## **在macOS中下载最新系统并写入到U盘**

### 1.使用终端运行一下命令查找最新版系统

```bash
softwareupdate --list-full-installers
```

### 2.使用命令下载指定的macOS镜像

 **eg:**

```bash
softwareupdate --fetch-full-installer --full-installer-version 12.6
```

 以上命令下载完成后，在 /Applications 目录下就会有一个名为 Install macOS Monterey.app 应用，这个就是完整的安装镜像了。

### 3.使用Apple官方的写入镜像方法将镜像写入U盘

 1.连接用于可启动安装程序的 U盘或其他宗卷。

 2.打开“终端”，它位于“应用程序”文件夹的“实用工具”文件夹中。

 3.终端”中输入或粘贴以下命令之一。

 这些假设安装程序位于“应用程序”文件夹中，而 MyVolume 是您 正在使用的 U盘或其他宗卷的名称。

 如果它具有不同的名称，请在这些命令中将*MyVolume*替换为您 的卷的名称。

```bash
Monterey:

sudo /Applications/Install\ macOS\ Monterey.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

Big Sur:

sudo /Applications/Install\ macOS\ Big\ Sur.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

Catalina:

sudo /Applications/Install\ macOS\ Catalina.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

Mojave:

sudo /Applications/Install\ macOS\ Mojave.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume

High Sierra:

sudo /Applications/Install\ macOS\ High\ Sierra.app/Contents/Resources/createinstallmedia --volume /Volumes/MyVolume
```