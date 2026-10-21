---
title: docker容器安装命令
date: 2022-10-29 22:09:45
category: Docker
tags: Docker
index_img: /img/default.png
banner_img:

---

Alist

```bash
# 1.docker run Alist
docker run -d --restart=always -v /root/docker/alist:/opt/alist/data -p 443:443 --name="alist" xhofe/alist:latest
# 2.show alist password
docker exec -it alist ./alist admin
```

OpenWrt

```bash
# 1.open ip promisc
ip link set eth0 promisc on
# 2.set macvlan network
docker network create -d macvlan --subnet=10.0.0.0/24 --gateway=10.0.0.1 -o parent=eth0 macnet
# 3.docker run OpenWrt
docker run -itd --name=OpenWrt --restart always --network macnet --ip 10.0.0.20 --privileged muchenh/openwrt:2.1.0 /sbin/init
```

BTPanel

```bash
# 1.open ip promisc
ip link set eth0 promisc on
# 2.set macvlan network
docker network create -d macvlan --subnet=10.0.0.0/24 --gateway=10.0.0.1 -o parent=eth0 macnet
# 3.docker run BTPanel
docker run -itd --name=BTPanel --restart always --ip 10.0.0.15 --network macnet --privileged=true muchenh/btpanel:1.0.0 /sbin/init -c "service ssh start&&service bt start&&service mysqld start&&service nginx start&&tail -f /root/sw2cn.sh"
```

Portainer

```bash
# 1.create portainer_data
docker volume create portainer_data
# 2.docker run portainer
docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:2.16.2
```

Qinglong

```bash
# 1.docker run qinglong
docker run -itd -v /root/docker/ql/data:/ql/data -p 5700:5700 --name ql --hostname ql --restart always whyour/qinglong:latest
# 2.fix dependent
docker exec -it ql bash
curl -fsSL https://git.metauniverse-cn.com/https://raw.githubusercontent.com/shufflewzc/QLDependency/main/Shell/QLOneKeyDependency.sh | sh
```

Homeassistant

```bash
# 1.docker run homeassistant
docker run -d --restart=always --name="home-assistants" -v /root/docker/homeassistant/config:/config --net=host homeassistant/home-assistant:latest
```

Frpc

```bash
# docker run frpc
docker run --restart=always --network host -d -v /root/docker/frp/frpc.ini:/etc/frp/frpc.ini --name frpc snowdreamtech/frpc:0.48.0
```

Frps

```bash
# docker run frps
docker run --restart=always --network host -d -v /root/docker/frp/frps.ini:/etc/frp/frps.ini --name frps snowdreamtech/frps:0.48.0
```

Samba

```bash
# docker run samba
docker run -itd --name samba -p 139:139 -p 445:445 -v /mnt/Disk:/share dperson/samba -w "WORKGROUP" -u "muchenH;passwd" -s "share;/share;yes;no;no;muchenH;muchenH;muchenH"
```