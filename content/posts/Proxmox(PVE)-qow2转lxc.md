---
title: PVE-qcow2转lxc容器
date: 2023-09-06 15:35:46
category: PVE
tags: PVE
index_img: /img/proxmox.png
banner_img:
---

## qcow2镜像转lxc容器提高虚拟机运行效率

### 从[官网](http://cloud.centos.org/centos/7/images/)获取qcow2镜像（以CentOS7为例）

* [直链下载](http://cloud.centos.org/centos/7/images/CentOS-7-x86_64-GenericCloud.qcow2)

* 其他渠道 

### 登入PVE后台进行如下操作

```bash
# 创建虚拟硬盘分区
modprobe nbd max_part=8
# 将下载的qcow2镜像挂载为nbd虚拟磁盘
qemu-nbd --connect=/dev/nbd1 /root/CentOS-7-x86_64-GenericCloud.qcow2
# 查看虚拟磁盘分区情况
fdisk -l |grep nbd1
# 建立临时文件夹并将创建的虚拟磁盘挂载到临时目录
mkdir /root/os && mount /dev/nbd1p1 /root/os
# 进入临时目录
cd os
# 将目录下文件打包成适合CT容器创建的rootfs压缩文件
tar -czvf /root/CentOS7.rootfs.tar.gz *
# 将打包好的压缩文件移动到CT模板保存目录，照常进行CT容器的创建
mv CentOS7.rootfs.tar.gz /var/lib/vz/template/cache/

```

```bash
# 可能会用到的工具（修改虚拟磁盘相关设置信息）
apt-get install libguestfs-tools
# 修改root密码
virt-customize -a CentOS-7-x86_64-GenericCloud.qcow2 --root-password password:asiydfvoavlc
```



### 创建CT容器

* 设置`CT ID`以及`主机名` `密码` ，取消勾选无嵌套的容器，以便于安装`docker`类虚拟化软件 

![1](./../media/Proxmox(PVE)-qow2转lxc/image-20230906151209368.png)

* 选择之前由`qcow2` 转化的`CT 模板` 

![2](./../media/Proxmox(PVE)-qow2转lxc/image-20230906153704687.png)

* 设置磁盘大小以及存储位置

![3](./../media/Proxmox(PVE)-qow2转lxc/image-20230906153729637.png)

* 设置`CPU` 核心数量 ，这边建议直接拉满

![4](./../media/Proxmox(PVE)-qow2转lxc/image-20230906153750862.png)

* 设置内存大小以及交换分区大小

![5](./../media/Proxmox(PVE)-qow2转lxc/image-20230906153812388.png)

* 设置网络，`IPv4`和`IPv6` 建议按如下设置，关闭防火墙

![6](./../media/Proxmox(PVE)-qow2转lxc/image-20230906153838730.png)

* 若无特殊需求直接下一步

![7](./../media/Proxmox(PVE)-qow2转lxc/image-20230906153854706.png)

* 最后确认一下配置是否正确，点击完成即可开始创建容器

![8](./../media/Proxmox(PVE)-qow2转lxc/image-20230906153914372.png)

* 如下是创建过程，若显示`TASK OK` 则表示创建成功

![9](./../media/Proxmox(PVE)-qow2转lxc/image-20230906154738193.png)



THAT'S ALL !!!
