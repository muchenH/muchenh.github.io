---
title: Ubuntu系统安装docker
date: 2022-10-25 22:09:45
category:
- Linux
- Docker
tags: Linux
index_img: /img/default.png
banner_img:

---

# 使用一键安装脚本快速部署Docker

将以下命令复制到一个新建的文本文件，命名为 `install-docker.sh`

```bash
#! /bin/bash

date "+%Y年%m月%d日 周%w %H:%M:%S"
echo '开始安装 Docker'
apt-get update
echo y | apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
echo y | apt-get install docker-ce docker-ce-cli containerd.io
docker run hello-world
echo 'Docker 安装完成，请检查是否出现 Hello from Docker!'
```

随后将文件复制到Ubuntu系统内你想要上传的路径，这里使用`scp`传输，方便快捷。

在`install.sh`存在目录打开终端，输入以下内容，其中

| 命令                       | 说明                   |
| -------------------------- | ---------------------- |
| IP                         | Ubuntu系统对应的IP地址 |
| [需要保存该文件的绝对路径] | 例如 `/root`           |

```bash
scp install.sh root@IP:[需要保存该文件的绝对路径]
```

上传完成后使用终端连接到Ubuntu ，在你上传的目录里输入以下命令

```bash
sh install.sh
```

等待脚本运行完成，当出现`Hello from Docker`字样，即表示安装成功，此时输入：

```bash
docker info
```

若出现以下内容，docker已经安装完成

```bash
OneCloud ~# docker info
Client:
 Context:    default
 Debug Mode: false
 Plugins:
  app: Docker App (Docker Inc., v0.9.1-beta3)
  buildx: Docker Buildx (Docker Inc., v0.9.1-docker)
  compose: Docker Compose (Docker Inc., v2.12.0)

Server:
 Containers: 3
  Running: 3
  Paused: 0
  Stopped: 0
 Images: 5
 Server Version: 20.10.20
 Storage Driver: overlay2
  Backing Filesystem: extfs
  Supports d_type: true
  Native Overlay Diff: true
  userxattr: false
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Cgroup Version: 1
 ········
 ········
 ········
 Docker Root Dir: /var/lib/docker
 Debug Mode: false
 Registry: https://index.docker.io/v1/
 Labels:
 Experimental: false
 Insecure Registries:
  127.0.0.0/8
 Registry Mirrors:
  https://registry.docker-cn.com/
 Live Restore Enabled: false
```

