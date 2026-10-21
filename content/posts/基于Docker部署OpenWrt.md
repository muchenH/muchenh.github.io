---
title: 基于Docker部署OpenWrt
date: 2022-10-24 22:09:45
category: 项目实战
tags: pygame
index_img: /img/default.png
banner_img:

---



## 基于Docker部署OpenWrt

```bash
# 1.下载镜像
wget https://op.supes.top/releases/targets/armvirt/64/openwrt-09.05.2022-armvirt-64-l1pro-rootfs.tar.gz
# 2.docker导入镜像
cat openwrt-09.05.2022-armvirt-64-l1pro-rootfs.tar.gz | docker import - openwrt:0.0.1
# 3.开启网口混杂
ip link set eth0 promisc on
# 4.创建macnet网络
docker network create -d macvlan --subnet=192.168.1.0/24 --gateway=192.168.1.1 -o parent=eth0 macnet
# 5.基于镜像启动docker容器
docker run -d --name=OpenWrt --restart always --network macnet --ip 192.168.1.10 --privileged openwrt:0.0.1 /sbin/init
# 6.修改容器内openwrt管理IP地址
docker exec OpenWrt sed -e "s/10.0.0.1/192.168.1.10/" -i /etc/config/network
# enjoy it ！！！
```