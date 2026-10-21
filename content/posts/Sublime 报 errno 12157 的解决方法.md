---
title: Sublime 报 errno 12157 的解决方法
date: 2026-09-23 11:39:45
category: Windows
tags: Windows
index_img: /img/default.png
banner_img:

---

# Sublime Text Package Control 报 Secure channel error（errno 12157）的解决方法

在 Windows 系统中使用 Sublime Text 的 Package Control 安装插件时，有时会遇到类似下面的错误：

```text
Package Control: Error downloading channel.
Secure channel error, server not providing SSL
(errno 12157) during HTTP write phase of downloading
https://packagecontrol.github.io/channel/channel_v4.json
```

同时还可能出现：

```text
Package Control: Error downloading channel.
Secure channel error, server not providing SSL
(errno 12157) during HTTP write phase of downloading
https://packages.sublimetext.com/channel_v4.json
```

这类问题通常不是 Package Control 本身损坏，而是 **Windows 的 SSL/TLS 通信、代理配置或者 Sublime Text 使用的网络下载方式出现问题**。

本文记录几种常见且有效的解决方法。

---

# 一、错误原因

错误中的：

```text
errno 12157
```

对应 Windows 的：

```text
ERROR_INTERNET_SECURITY_CHANNEL_ERROR
```

简单来说，就是 Windows 在建立 HTTPS 安全通信通道时出现了问题。

Package Control 在 Windows 下进行网络通信时，可能使用 Windows 的 WinINet/安全通信组件。如果系统 TLS 配置、证书、代理或者网络环境存在问题，就可能导致 Package Control 无法正常访问：

```text
https://packagecontrol.github.io/
```

或者：

```text
https://packages.sublimetext.com/
```

---

# 二、首先检查 Windows 的 TLS 1.2

按：

```text
Win + R
```

输入：

```text
inetcpl.cpl
```

打开 **Internet 属性**。

进入：

```text
高级 → 安全
```

检查是否启用了：

```text
使用 TLS 1.2
```

建议保持：

```text
TLS 1.0  ❌
TLS 1.1  ❌
TLS 1.2  ✅
TLS 1.3  ✅（如果系统提供）
```

如果系统提供 TLS 1.3，也可以保持开启。

---

# 三、开启 TLS 1.2 有什么影响？

TLS 是 HTTPS 使用的加密协议。

TLS 1.2 是目前非常成熟、兼容性非常好的 HTTPS 协议版本。

开启 TLS 1.2 一般不会影响正常使用，反而有利于现代 HTTPS 网站和软件正常建立安全连接。

例如：

| 项目 | 影响 |
|---|---|
| HTTPS 网站 | 正常 |
| GitHub | 正常 |
| Sublime Package Control | 有利于正常连接 |
| Windows Update | 正常 |
| 浏览器 | 正常 |
| 新软件 | 正常 |
| HTTP 网站 | 不受影响 |

因此，如果 Windows 中没有启用 TLS 1.2，建议开启。

---

# 四、推荐解决方法：让 Package Control 使用 urllib

如果开启 TLS 1.2 后仍然出现：

```text
Secure channel error
errno 12157
```

推荐直接修改 Package Control 的下载方式。

打开 Sublime Text：

```text
Preferences
→ Package Settings
→ Package Control
→ Settings - User
```

添加：

```json
{
    "downloader_precedence": {
        "windows": ["urllib"]
    }
}
```

如果原来的配置文件中已经有其他配置，不要删除原配置，只需要增加：

```json
"downloader_precedence": {
    "windows": ["urllib"]
}
```

例如：

```json
{
    "timeout": 10,
    "downloader_precedence": {
        "windows": ["urllib"]
    }
}
```

保存配置。

然后：

1. 完全退出 Sublime Text
2. 重新启动 Sublime Text
3. 按 `Ctrl + Shift + P`
4. 执行：

```text
Package Control: Install Package
```

再次尝试安装插件。

---

# 五、为什么切换到 urllib 有效？

问题的关键在于：

```text
Windows
   ↓
WinINet / Secure Channel
   ↓
HTTPS
   ↓
Package Control
```

当 Windows 的 Secure Channel 出现问题时，Package Control 就可能产生：

```text
errno 12157
```

切换：

```json
"downloader_precedence": {
    "windows": ["urllib"]
}
```

可以让 Package Control 优先使用另一套下载方式，从而绕过部分 WinINet/Windows Secure Channel 相关问题。

因此，对于 Windows 系统上的：

```text
Secure channel error
errno 12157
```

这个方法值得优先尝试。

---

# 六、如果电脑使用了代理

如果电脑使用 Clash、V2Ray、其他代理软件，或者公司网络提供了 HTTP 代理，那么还需要检查代理配置。

例如本机 HTTP 代理地址为：

```text
127.0.0.1:7890
```

可以在 Package Control 的用户配置中加入：

```json
{
    "downloader_precedence": {
        "windows": ["urllib"]
    },
    "http_proxy": "127.0.0.1:7890",
    "https_proxy": "127.0.0.1:7890"
}
```

然后重新启动 Sublime Text。

---

# 七、检查代理是否真的可以访问 HTTPS

可以在 Windows CMD 中测试：

```cmd
curl -I https://packagecontrol.github.io/channel/channel_v4.json
```

再测试：

```cmd
curl -I https://packages.sublimetext.com/channel_v4.json
```

如果能够正常返回 HTTP 响应，例如：

```text
HTTP/1.1 200 OK
```

说明当前网络基本可以正常访问 Package Control 服务器。

如果出现：

```text
SSL certificate problem
```

或者：

```text
SSL_ERROR
```

则需要进一步检查：

- Windows 根证书
- HTTPS 代理
- 代理软件
- TLS 配置
- 公司网络的 HTTPS 拦截

---

# 八、HTTPS 代理导致的问题

部分代理软件或者公司网络会对 HTTPS 进行中间人代理（MITM）。

通信过程可能变成：

```text
Sublime Text
     ↓
代理服务器
     ↓
HTTPS 解密/重新加密
     ↓
Package Control
```

这种情况下，代理服务器可能会使用自己的 CA 证书重新签发 HTTPS 证书。

如果 Windows 或 Python 环境不信任这个 CA，就可能产生 SSL 错误。

如果你使用的是带 HTTPS 解密功能的代理，需要检查代理软件是否安装了对应的根证书。

---

# 九、检查系统时间

HTTPS 证书验证依赖系统时间。

如果 Windows 的系统时间严重错误，也可能导致 HTTPS 证书验证失败。

可以检查：

```text
Windows 设置
→ 时间和语言
→ 日期和时间
```

建议开启：

```text
自动设置时间
自动设置时区
```

确保系统时间正确。

---

# 十、检查 Package Control 的 Channel 配置

如果错误信息中出现：

```text
https://packages.sublimetext.com/channel_v4.json.
```

需要特别注意最后的：

```text
.json.
```

正常 URL 应该类似：

```text
https://packages.sublimetext.com/channel_v4.json
```

而不是：

```text
https://packages.sublimetext.com/channel_v4.json.
```

如果你在 Package Control 用户配置中手动修改过：

```json
"channels"
```

建议检查相关配置。

打开：

```text
Preferences
→ Package Settings
→ Package Control
→ Settings - User
```

如果存在自定义：

```json
"channels": [
    "..."
]
```

确认 URL 是否正确。

如果没有特殊需求，可以考虑删除自定义 `channels` 配置，让 Package Control 使用默认配置。

---

# 十一、推荐的最终配置

如果是 Windows + Sublime Text，并且主要目的是解决：

```text
Secure channel error
errno 12157
```

可以使用：

```json
{
    "downloader_precedence": {
        "windows": ["urllib"]
    }
}
```

如果同时使用 HTTP 代理，例如：

```text
127.0.0.1:7890
```

则可以使用：

```json
{
    "downloader_precedence": {
        "windows": ["urllib"]
    },
    "http_proxy": "127.0.0.1:7890",
    "https_proxy": "127.0.0.1:7890"
}
```

---

# 十二、推荐排查顺序

遇到：

```text
Secure channel error
(errno 12157)
```

建议按照下面的顺序排查。

### 第 1 步：检查 TLS 1.2

打开：

```text
Win + R
→ inetcpl.cpl
→ 高级
→ 安全
```

确认：

```text
使用 TLS 1.2
```

已经开启。

---

### 第 2 步：切换 Package Control 下载方式

加入：

```json
{
    "downloader_precedence": {
        "windows": ["urllib"]
    }
}
```

然后重启 Sublime Text。

---

### 第 3 步：检查代理

如果使用代理，确认代理地址和端口正确。

例如：

```text
127.0.0.1:7890
```

可以配置：

```json
"http_proxy": "127.0.0.1:7890",
"https_proxy": "127.0.0.1:7890"
```

---

### 第 4 步：使用 curl 测试

执行：

```cmd
curl -I https://packagecontrol.github.io/channel/channel_v4.json
```

如果 curl 也无法访问，则重点检查 Windows、网络或者代理。

---

### 第 5 步：检查 HTTPS 代理证书

如果使用了 HTTPS MITM 代理，则检查代理软件的 CA 证书是否正确安装并受到信任。

---

# 十三、结论

对于 Windows 系统中的 Sublime Text Package Control：

```text
Secure channel error
errno 12157
```

最常见的处理思路是：

```text
检查 TLS 1.2
       ↓
检查代理
       ↓
切换 Package Control 到 urllib
       ↓
使用 curl 测试 HTTPS
       ↓
检查证书 / HTTPS MITM
```

其中，**最值得优先尝试的是修改 Package Control 配置：**

```json
{
    "downloader_precedence": {
        "windows": ["urllib"]
    }
}
```

如果电脑使用代理，则进一步配置：

```json
{
    "downloader_precedence": {
        "windows": ["urllib"]
    },
    "http_proxy": "127.0.0.1:7890",
    "https_proxy": "127.0.0.1:7890"
}
```

通常不需要为了这个问题去开启 TLS 1.0 或 TLS 1.1。保持 TLS 1.2 开启即可。

> **注意：** 如果修改后仍然无法连接，建议优先使用 `curl` 判断问题究竟发生在 Sublime Text、Windows TLS、代理还是网络环境，而不是反复重装 Package Control。