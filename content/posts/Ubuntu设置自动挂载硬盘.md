---
title: Ubuntu设置自动挂载硬盘
date: 2022-10-25 22:09:45
category: Linux
tags: Linux
index_img: /img/default.png
banner_img:

---

# 如何在Ubuntu设置自动挂载硬盘

## 1.使用命令查看分区

确认硬盘状态

```bash
sudo fdisk -l
df -f
```

可以根据提供的磁盘信息确定想挂载的磁盘，以及确定挂载的位置。我这里的硬盘位于/dev/sda
比如我想将硬盘挂载到 /root/repo目录下，则首先需要创建目录

## 2.创建挂载目录

```bash
sudo mkdir /root/repo
```

## 3.开始挂载

sudo mount /dev/sda/ /root/repo/

## 4.设置开机自动挂载

### 4.1查询挂载硬盘UUID

```bash
sudo blkid /dev/sda
```

返回的信息为

```bash
/dev/sda: LABEL="Data" UUID="88069947069936E2" TYPE="ntfs" PARTLABEL="Basic data partition" PARTUUID="7170f9a7-9c9f-43d8-9916-da47aa9101f7"
```

则能够从返回信息中获取

```bash
UUID="88069947069936E2"
```

### 4.2修改文件

打开文件/etc/fstab文件

```bash
sudo gedit /etc/fstab
```

在文档末尾添加裹在磁盘的信息。
格式为：

```bash
[UUID=************] [挂载磁盘分区]  [挂载磁盘格式]  0  0
UUID=88069947069936E2 /root/repo ntfs defaults  0  0
```

第一个数字表明备份工具dump是否对此文件系统进行备份， 0为忽略， 1为备份。通常都设置为0。
第二个数字与磁盘检查有关。它告诉fsck检查此文件系统的顺序。0为忽略检查，1为先检查此分区，2为后检查该分区。建议根分区/此值设为1， 普通分区设为2。使用0来禁止启动时磁盘检查。