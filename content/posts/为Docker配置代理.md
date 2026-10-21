---
title: 为 Docker 配置代理
date: 2025-12-22 21:49:45
category: Docker
tags: Docker
index_img: /img/default.png
banner_img:

---

在拉取 Docker 镜像时，如果处于需要通过代理才能访问外网的环境中（比如公司内网），可以通过以下几种方式为 Docker 客户端或 Docker daemon 配置代理：

---

## 一、为 Docker CLI（命令行）设置代理（仅影响当前 shell）

这种方式适用于临时使用代理拉取镜像，只对当前终端会话有效。

```bash
# 设置 HTTP 和 HTTPS 代理环境变量
export HTTP_PROXY=http://your-proxy-host:port
export HTTPS_PROXY=http://your-proxy-host:port

# 如果代理需要认证
export HTTP_PROXY=http://username:password@your-proxy-host:port
export HTTPS_PROXY=http://username:password@your-proxy-host:port

# 然后执行 docker pull
docker pull nginx
```

> 注意：这种设置只对当前 shell 生效，关闭终端后失效。

---

## 二、为 Docker Daemon 配置代理（推荐长期使用）

Docker daemon 是后台服务，负责实际的镜像拉取等操作。要让所有 `docker pull` 操作都走代理，需要配置 daemon 的 systemd 服务。

### 步骤如下（以 Linux 系统为例）：

1. **创建 systemd drop-in 目录**（如果不存在）：
   ```bash
   sudo mkdir -p /etc/systemd/system/docker.service.d
   ```

2. **创建代理配置文件**，例如 `/etc/systemd/system/docker.service.d/proxy.conf`：
   ```ini
   [Service]
   Environment="HTTP_PROXY=http://your-proxy-host:port"
   Environment="HTTPS_PROXY=http://your-proxy-host:port"
   Environment="NO_PROXY=localhost,127.0.0.1,.example.com"
   ```

   > 如果代理需要用户名密码：
   > ```
   > Environment="HTTP_PROXY=http://user:pass@your-proxy-host:port"
   > ```

3. **重新加载 systemd 并重启 Docker**：
   ```bash
   sudo systemctl daemon-reexec
   sudo systemctl restart docker
   ```

4. **验证配置是否生效**：
   ```bash
   systemctl show --property=Environment docker
   ```

---

## 三、Windows 或 macOS 上的 Docker Desktop

- **Windows / macOS 用户**：打开 Docker Desktop 应用 → Settings → Resources → Proxies
- 选择 “Manual proxy configuration”，填入 HTTP/HTTPS 代理地址。
- 点击 Apply & Restart。

---

## 四、注意事项

- `NO_PROXY` 很重要：避免本地地址（如 `localhost`, `127.0.0.1`, 私有仓库域名）也走代理。
- 如果使用私有镜像仓库（如 Harbor），记得将其域名加入 `NO_PROXY`。
- 有些企业代理不支持 HTTPS CONNECT，可能需要额外配置或联系网络管理员。

---

如有具体操作系统或代理类型（如 SOCKS、带认证等），可提供更详细指导。