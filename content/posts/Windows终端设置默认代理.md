---
title: Windows终端设置默认代理
date: 2025-12-25 15:51:15
category: Windows
tags: Windows
index_img: /img/default.png
banner_img:
---


要在**打开指定的 PowerShell 窗口时自动设置临时代理**（仅对当前会话有效），可以通过以下方法实现。方法的核心思路是：**在 PowerShell 启动时自动执行一段设置代理的脚本**。

---

## 通过 Windows Terminal（如果使用）

如果你使用 **Windows Terminal**（微软现代终端），可以为其创建一个专用配置文件：

1. 打开 Windows Terminal 设置（`Ctrl + ,`）
2. 点击“+ 添加新配置文件”
3. 配置如下：
   - 名称：`PowerShell with Proxy`
   - 命令行：
     ```powershell
     powershell.exe -NoExit -Command "$env:HTTP_PROXY='http://127.0.0.1:7890'; $env:HTTPS_PROXY='http://127.0.0.1:7890'; Write-Host '🔌 代理已就绪' -Fore Green"
     ```
5. 可以将启动目录改为使用父进程目录，这样在任意目录中打开即可进入对应目录下；或者可以使用 `%USERPROFILE%` 即当前用户家目录
5. 保存后，即可从下拉菜单中快速启动带代理的 PowerShell。

---

## 🔍 验证代理是否生效

在 PowerShell 中运行以下命令测试：
```powershell
Invoke-WebRequest -Uri "http://httpbin.org/ip" -UseBasicParsing
```
如果返回的 IP 是代理服务器的出口 IP，说明代理生效。

> ❌ 不要用 `ping` 测试，因为 ICMP 不走 HTTP/HTTPS 代理。