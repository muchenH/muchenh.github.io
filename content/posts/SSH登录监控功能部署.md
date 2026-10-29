---
title: 从零搭建 SSH 登录实时告警与每日汇总系统
date: 2026-10-29 21:35:40
category: Linux
tags:
  - Linux
  - SSH
  - 监控
index_img: /img/default.png
banner_img:

---

> **阅读说明（务必先看）**
>
> 文中出现的 `alert.example.com`、`203.0.113.10`、`192.168.1.0/24` 均为示例域名与 RFC 文档专用网段；`8443` 为**示例端口**，请按实际环境替换。所有形如 `AGENT_TRIGGER_TOKEN`、`BEARER_TOKEN`、`DINGTALK_SECRET` 的串都是占位符，不是真实凭据。代码块内为便于整段复制，占位符一律不加尖括号（尖括号在 shell 里会被当成重定向符号）。

服务器被人登录了，你多久能知道？

日志里有记录，但你不会一直盯着 `journalctl`。真正的痛点不是"没有审计"，而是**没有推送**——事件发生在凌晨三点，等你第二天发现问题，人家已经干完活了。

这篇文章记录一次完整的落地：**被控端 SSH 登录成功 → 秒级推送到钉钉，并在每天 20:00 汇总当日全部登录**。规模是 1 台公网汇总端 + 3 台 Linux 被控端 + 2 台路由器被控端。

写这篇文章的主要目的不是给一份能跑的配置，而是**把一路上踩到的十几个坑摊开讲清楚**——其中至少有 6 个会让你的部署"看起来成功，实际丢告警"。

## 一、需求与整体设计

先把目标钉死，避免做成一个只会刷屏的玩具：

- 被控端 SSH **成功登录**时立即上报公网汇总端；
- 汇总端把记录（北京时间、来源 IP 与端口、用户、主机）通过钉钉机器人即时推送；
- 每日 20:00 汇总当日登录记录并推送；
- 汇总端自身也纳入监控，但自监控事件**不进**即时告警、**不进**日报（否则自己登录一下就响一次，很快你就会关掉整个通知）；
- 新增被控端只需在被控端部署，**汇总端零改动**。

### 1.1 拓扑

```text
┌─ 被控端 ────────────────────────────────────────────────┐
│                                                          │
│  A 类：systemd + journald + PAM（通用 Linux）            │
│    pamsignal ── 读 journal 的 PAM login_success          │
│                                                          │
│  B 类：procd + busybox syslog，无 journald/PAM           │
│    login-report ── logread -f 抓 dropbear 认证成功       │
│                                                          │
└────────────────┬─────────────────────────────────────────┘
                 │  POST JSON + Authorization: Bearer
                 │  HTTPS 8443（示例端口）
                 ▼
┌─ 汇总端 ────────────────────────────────────────────────┐
│  Caddy（TLS 终止 + Bearer 校验 + 路径限定）              │
│       │  reverse_proxy 127.0.0.1:8765                    │
│       ▼                                                  │
│  anotiflow（Python / FastAPI）                           │
│    ├─ /trigger/AGENT_TRIGGER_TOKEN → record_login        │
│    │      ├─ 写 SQLite（北京时间）                        │
│    │      └─ 内置 dingtalk action → 即时推送              │
│    ├─ interval 触发器 20:00 → daily_summary → 推送日报    │
│    └─ /trigger/SELF_TRIGGER_TOKEN → record_self_login    │
│           └─ 只写 self_logins，不配 dingtalk              │
│       ▼                                                  │
│  钉钉自定义机器人（text + 加签）                          │
└──────────────────────────────────────────────────────────┘
```

两个设计决策值得单独说明：

**第一，汇总端只开一个公网端口。** 80 / 443 全程不使用，反代自己终止 TLS。好处是不用跟别人的 Web 服务抢 443，也不必为了 ACME http-01 去开 80；代价是证书要走 DNS-01 或干脆手工续，这一点后面会讲。

**第二，自监控也绕公网域名回来。** 直觉上应该是 `127.0.0.1` 回环直连后端，但 pamsignal 会拒绝——原因见 §六第 2 条。多绕几十毫秒可接受，换来的是"只走一条代码路径"，不会出现"生产能通、自监控不通"这种半吊子状态。

## 二、先做一次硬分叉判断：被控端属于哪一类

这不是可选项，是**硬分叉**。判定错了,后面所有工作白做。

```sh
ps -p 1 -o comm=                      # systemd / procd / init
command -v journalctl                 # 有则可能是 A 类
ls /etc/pam.d 2>/dev/null | wc -l     # 输出 0 则必是 B 类
ldd --version 2>&1 | head -1          # glibc 还是 musl
uname -m
```

| 判定结果 | 类型 | 方案 |
|---|---|---|
| `systemd` + `journalctl` + `/etc/pam.d` 非空 + glibc | A 类 | pamsignal（源码构建） |
| `procd` 或无 journald，或 musl，或 `/etc/pam.d` 为空 | B 类 | 自维护 sh 采集器 |

**关键认知**：pamsignal 动态链接 `libsystemd.so.0`，整个设计建立在 `sd_journal_*` API 之上。musl 系统上**不可能**跑起来，也**不能**把 glibc 机器上编译好的二进制拷过去用。

实测数据：同一份 pamsignal 源码在三台机器上编出来的产物分别是 89304 B、93488 B、93488 B——编译器与 glibc 版本不同，产物必然不同。**只搬源码，在目标机本地编译**，这是唯一可靠的跨机方式。

## 三、组件选型

| 组件 | 角色 | 选它的理由 |
|---|---|---|
| pamsignal | A 类采集端 | C 实现，从 journald 抓 PAM 事件，原生支持 webhook + Bearer，非阻塞发送，体积极小 |
| login-report | B 类采集端 | 约 7.6 KB 的 POSIX sh 脚本，用 `logread -f` + FIFO + `jq` + `curl` 复刻同一套上报协议 |
| anotiflow | 汇总端 | 单进程同时提供 API 触发器、定时触发器、自定义 Python 行为，天然适合"收上报 + 写库 + 推钉钉 + 日报" |
| Caddy | 反向代理 | TLS 终止 + 请求头匹配 + 路径限定，配置比 Nginx 短一截，且内置自动 HTTPS（本项目显式关掉） |

为什么不用 fail2ban？它解决的是"封禁"，不是"通知"——而且它默认根本不会告诉你**成功**登录。为什么不用现成的日志平台？对五台机器的规模来说，那只是把复杂度从部署转移到运维。

## 四、汇总端部署

### 4.1 系统准备

```sh
timedatectl set-timezone Asia/Shanghai
apt-get update
apt-get install -y python3 python3-venv sqlite3 curl
```

时区必须对。`user_actions.py` 内部虽然是显式按 `+08:00` 转换时间戳（不依赖本地时区解析 `@timestamp`），但**定时触发器用的是系统本地时间**——时区错 8 小时，日报就会在凌晨 4 点发出来。

Python 环境用系统 `venv` 就够，不必追 `uv`（它的安装脚本走国外源，受限环境直接装不上）：

```sh
mkdir -p /opt/anotiflow-run
cd /opt/anotiflow-run
python3 -m venv .venv
.venv/bin/pip install anotiflow
```

访问不了国外 PyPI 时，把镜像写进 venv 自己的 `pip.conf`：

```ini
# /opt/anotiflow-run/.venv/pip.conf
[global]
index-url = https://mirrors.aliyun.com/pypi/simple/
```

写进 venv 内部而不是全局，是为了不污染这台机器上其他 Python 项目。

### 4.2 令牌与凭据

需要三组互不相同的随机串，各自用 `openssl rand -hex 32` 生成：

| 令牌 | 存放位置 | 用途 |
|---|---|---|
| `AGENT_TRIGGER_TOKEN` | 各被控端配置 + 汇总端 `config.toml` | 被控端上报路径 |
| `SELF_TRIGGER_TOKEN` | 汇总端 `config.toml` + 自监控配置 | 自监控路径 |
| `BEARER_TOKEN` | 各被控端配置 + 自监控配置 + `Caddyfile` | 请求头第二因素 |
| `DINGTALK_TOKEN` / `DINGTALK_SECRET` | **仅** `config.toml` | 钉钉加签 |

核对时**只打印指纹**（前 8 位 + sha256 前 12 位），永远不要把完整令牌打到终端、日志或聊天记录里。打印任何含凭据的文件时用白名单（只输出允许的键、值打码），不要用"排除已知敏感项"的黑名单——那依赖"我记得所有敏感项"，一定会漏。

### 4.3 user_actions.py：三个必须理解的点

这是整个系统里唯一有业务逻辑的地方。契约（对照 anotiflow 0.2.5 源码核实）：

- 回调签名是 `fn(context: dict)`；
- `context` 只有两个键：`{"task": Task, "trigger": Trigger}`；
- 载荷取 `context["trigger"].payload` —— **是对象属性，不是 dict**；
- 同一个 task 的所有 action 共享同一个 context，所以本模块写入的 `alert_text` / `summary_text` 会被后续 dingtalk action 读到。

**坑一：`trigger.payload` 不是 dict**

```python
# 错的：Trigger 是对象，不是 dict，这里会 AttributeError
payload = context["trigger"].get("payload", {})

# 对的
payload = getattr(context.get("trigger"), "payload", None)
```

**坑二：字段名是 `host.hostname` 而不是 `host.name`**

pamsignal 按 ECS 规范发送的是 `host.hostname`。如果你照文档写 `host.name`，拿到的是**空主机名**——而空主机名不会报错，只会让你的告警看起来"少了一半信息"。稳妥做法是多候选兜底：

```python
_TS_KEYS   = ("@timestamp", "timestamp", "time", "ts", "event.created", "created_at")
_IP_KEYS   = ("source.ip", "source_ip", "src_ip", "ip", "client_ip", "remote_ip")
_PORT_KEYS = ("source.port", "source_port", "src_port", "port", "client_port", "remote_port")
_USER_KEYS = ("user.name", "user_name", "username", "user", "auth.user", "account")
_HOST_KEYS = ("host.name", "host_name", "hostname", "host.hostname", "machine", "node")
```

**坑三：去重键必须包含来源端口**

```python
_UNIQUE_COLS = ("login_time_bj", "src_ip", "src_port", "user_name", "host_name")
```

看起来四列足够唯一了？不。同一秒、同一个 IP、同一个用户、同一台主机，**只端口不同**的两次登录是完全可能的（脚本并发连两台机器，或者你手快连了两次）。四列键会把第二条静默丢掉——`INSERT OR IGNORE` 不报错，只是不插入。

更阴的是这个迁移陷阱：

```python
# SQLite 不能改约束，而 CREATE UNIQUE INDEX IF NOT EXISTS
# 在同名索引已存在时会直接跳过 —— 所以必须显式 DROP 后重建
existing = tuple(r[2] for r in conn.execute(f"PRAGMA index_info(ux_{table})"))
if existing and existing != _UNIQUE_COLS:
    conn.execute(f"DROP INDEX IF EXISTS ux_{table}")
conn.executescript(_INDEX_DDL.format(t=table))
```

否则旧库升级后去重键**还是 4 列**，你改了半天代码，行为一点没变。

**坑四（隐蔽）：钉钉的长度上限是字节，不是字符**

```python
SAFE_BYTES = 16000  # 钉钉上限 20000 字节，留 4000 余量

def _clip(text: str, limit: int = SAFE_BYTES) -> str:
    raw = text.encode("utf-8")
    if len(raw) <= limit:
        return text
    head = raw[:limit].decode("utf-8", "ignore")
    return f"{head}\n…（已达钉钉长度上限，后续 {len(raw) - limit} 字节已截断）"
```

钉钉上限是 20000 **字节**，中文 3 字节/字。按字符截断到 18000 会得到最多 54000 字节——直接超限失败，日报发不出去，而且失败通常在负载最高的一天。

### 4.4 config.toml：三个任务

```toml
[server]
host = "127.0.0.1"
port = 8765

# 任务 1：被控端上报 → 写库 + 即时钉钉
[[tasks]]
name = "agent-login-record"
enabled = true

[[tasks.triggers]]
type = "api"
name = "agent-webhook"
token = "AGENT_TRIGGER_TOKEN"

[[tasks.actions]]
type = "custom"
path = "user_actions.record_login"

[[tasks.actions]]
type = "dingtalk"
token = "DINGTALK_TOKEN"
secret = "DINGTALK_SECRET"
msgtype = "text"
message_template = "{alert_text}"

# 任务 2：每日 20:00 汇总
[[tasks]]
name = "daily-summary"
enabled = true

[[tasks.triggers]]
type = "interval"
unit = "day"
at = "20:00"

[[tasks.actions]]
type = "custom"
path = "user_actions.daily_summary"

[[tasks.actions]]
type = "dingtalk"
token = "DINGTALK_TOKEN"
secret = "DINGTALK_SECRET"
msgtype = "text"
message_template = "{summary_text}"

# 任务 3：汇总端自监控 → 只写 self_logins，故意不配 dingtalk
[[tasks]]
name = "self-login-audit"
enabled = true

[[tasks.triggers]]
type = "api"
name = "self-webhook"
token = "SELF_TRIGGER_TOKEN"

[[tasks.actions]]
type = "custom"
path = "user_actions.record_self_login"
```

要点：

- 模板里**只写** `{alert_text}` / `{summary_text}`。不要写 `{trigger.payload[source][ip]}` 这类字段路径——字段缺失时 `str.format` 会把裸花括号原样发出去，群里就会出现一条 `{trigger.payload…}` 的怪消息。
- 钉钉凭据只在 `config.toml` 一处，`user_actions.py` 不碰。
- 自监控 task **不配** dingtalk action，这就是"不产生噪音"的实现方式——不是靠代码判断，是靠配置里没有那个 action。
- 不需要设 `PYTHONPATH`，anotiflow 的 loader 会把工作目录与配置目录自动加进 `sys.path`。

### 4.5 systemd 单元

```ini
[Unit]
Description=anotiflow SSH login aggregator
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/anotiflow-run
Environment=PYTHONDONTWRITEBYTECODE=1
ExecStart=/opt/anotiflow-run/.venv/bin/anotiflow --config /opt/anotiflow-run/config.toml
Restart=on-failure
RestartSec=5s

ProtectSystem=strict
ReadWritePaths=/opt/anotiflow-run/data /opt/anotiflow-run/config.toml
NoNewPrivileges=yes
CapabilityBoundingSet=

[Install]
WantedBy=multi-user.target
```

- `Environment=PYTHONDONTWRITEBYTECODE=1` **必加**，否则 `__pycache__` 写入会被只读沙箱挡掉，程序在第一次 import 自定义模块时才炸，排查起来很费时间。
- `Restart=on-failure` 而不是 `always`：主动 stop 之后不该复活。
- 不允许建系统用户只能以 root 跑时，用 `CapabilityBoundingSet=` 清空能力集补偿（`CapEff=0`），但这只是"少给权限"，不等于隔离，残余风险要写进交付文档。
- 日志直接进 journald，不再额外写 `anotiflow.log`——journald 自带轮转与限流，落文件是重复。

### 4.6 反向代理与 TLS

后端只监听 `127.0.0.1:8765`，对外由 Caddy 终止 TLS：

```caddyfile
{
	admin off
	auto_https off
}

:8443 {
	tls /etc/caddy/certs/alert.example.com.pem /etc/caddy/certs/alert.example.com.key

	# 只有带正确 Bearer 的 /trigger/* 才能进后端
	@authed {
		path /trigger/*
		header Authorization "Bearer BEARER_TOKEN"
	}
	handle @authed {
		reverse_proxy 127.0.0.1:8765
	}

	# 路径对但 Bearer 不对 → 401（不泄露后端存在性）
	@triggerpath path /trigger/*
	handle @triggerpath {
		respond "unauthorized" 401
	}

	respond "not found" 404
}
```

**为什么 Bearer 必须由反代强制？** 因为 anotiflow 的 `/trigger/**` 与 `/ws/**` 绕过 `admin_token`，并且**完全不校验 `Authorization` 头**——路径里的 token 就是唯一认证。反代补上 Bearer 是切切实实的第二因素：光拿到路径 token 不够，还得知道 Bearer。

几个配置上的注意点：

- `admin off` + `auto_https off` + 显式 `tls` 指令，避免 Caddy 自作主张去申请证书（它一旦尝试 80 端口验证失败，会反复重试）。
- 用路径白名单而不是来源 IP 白名单：被控端出口 IP 可能不固定，而 Bearer 已经提供了第二因素。两者选一即可，别都上——都上会让你在换宽带之后收到一堆 403。
- 证书目录 `0750 root:caddy`，**其他服务用户读不进去**是设计意图。如果某个非 root 服务需要读 CA，把证书**复制**到它自己的配置目录，**绝不**把该用户加进 `caddy` 组——那个组能读 TLS 私钥。

**证书策略上的一个现实取舍**：优先用公网 CA 证书而不是自签。自签的代价是每台客户端都要分发文件 + 处理权限，任何一处漏掉就是握手失败。而在不允许开放 80 端口的环境里，ACME http-01 用不了，只剩两条路：配 DNS API 走 DNS-01，或者**手工续期**。

如果选了手工续期，那么"到期忘了换"就是这个系统里最现实的故障点，必须配监控——这一点在 §4.7。

### 4.7 证书到期告警

- 一个 oneshot 脚本读证书 `notAfter`，剩余天数 ≤ 阈值（如 14 天）时推钉钉；
- 配 `.timer` 每天固定时间跑，`Persistent=true` 保证停机后补跑；
- 钉钉加签逻辑复用 `config.toml` 里那组凭据，避免第二处密钥。

监控"证书快过期了"这件事本身不能依赖证书有效的 HTTPS 请求——所以这个检查脚本走的是普通的钉钉 webhook，跟你的服务证书无关。

### 4.8 汇总端自监控

复用 A 类被控端的构建方式，只是配置不同：

```ini
enable_notification_type = login_success
alert_cooldown_sec = 0
webhook_url = https://alert.example.com:8443/trigger/SELF_TRIGGER_TOKEN
webhook_auth_header = Authorization: Bearer BEARER_TOKEN
```

自监控写入 `self_logins` 表，该表**首次上报时才创建**（懒建）。所以查询前先查 `sqlite_master`，别假设它存在：

```sh
sqlite3 /opt/anotiflow-run/data/ssh_logins.db \
  "SELECT name FROM sqlite_master WHERE type='table';"
```

## 五、被控端部署

### 5.1 A 类：systemd + journald + PAM

**装构建依赖。** 只装 `libsystemd-dev` 不够，`meson setup` 会依次报缺 libcap / libgcrypt / lz4 / lzma / zstd / gpg-error 的开发包，一个一个试会浪费很多轮：

```sh
apt-get update
apt-get install -y --no-install-recommends \
    meson ninja-build pkg-config gcc \
    libsystemd-dev libcap-dev libgcrypt20-dev \
    liblz4-dev liblzma-dev libzstd-dev libgpg-error-dev
```

> **副作用预警**：Debian 12 上 `libsystemd-dev` 与 `systemd` 版本强绑定，安装时会连带升级 `systemd`/`udev`/`libpam-systemd` 等一批包（实测 11 个）。**升级前先记录 `systemctl --failed` 的现状**，否则事后分不清失败单元是升级造成的还是本来就有的。用 `systemctl show -p StateChangeTimestamp <unit>` 取时间戳对照，就能把"本来就有"和"升级引入"分开。

**从源码构建。** 这个仓库**没有 Makefile**，`make` 会直接失败：

```sh
git clone --depth 1 https://github.com/anhtuank7c/pamsignal.git /tmp/ps-build
cd /tmp/ps-build
meson setup build --buildtype=release --prefix=/usr
ninja -C build
ninja -C build install

/usr/bin/pamsignal --version     # 应输出 0.7.x
```

**配置。**

```sh
install -d -m 0755 /etc/pamsignal
cat > /etc/pamsignal/pamsignal.conf <<'EOF'
enable_notification_type = login_success
alert_cooldown_sec = 0
webhook_url = https://alert.example.com:8443/trigger/AGENT_TRIGGER_TOKEN
webhook_auth_header = Authorization: Bearer BEARER_TOKEN
EOF
chown root:systemd-journal /etc/pamsignal/pamsignal.conf
chmod 0640 /etc/pamsignal/pamsignal.conf
```

四个必须理解的点：

- **`alert_cooldown_sec = 0`**：默认是 60，而且冷却时间戳是**所有事件类型共用一个全局变量**——一分钟内的第二次真实登录会被静默丢弃。实测 4 次登录只推了 2 条。这是本文最重要的一行配置。
- **`webhook_url` 必须 `https://`**：源码里的 `is_https_url()` 是硬校验，没有回环例外。写 `http://` 或 `127.0.0.1` 会直接启动失败，报 `webhook_url must be an https:// URL`。
- **不要配 `webhook_ca_bundle`**：用公网 CA 证书时客户端系统 CA 已经够用，配了反而引入文件权限问题。
- **不要配 `trusted_sources`**：它会让 webhook 也被静音，日报直接缺记录。降噪应该在汇总端做，不该在采集端做。

**systemd 单元（不建系统用户）。**

pamsignal 在 `src/main.c` 里有 `if (geteuid() == 0) { … return 1; }`——**任何模式都拒绝 root**。如果不想为它建系统用户，用 `DynamicUser`：

```ini
[Unit]
Description=pamsignal - PAM login notifier
After=systemd-journald.service

[Service]
Type=simple
DynamicUser=yes
SupplementaryGroups=systemd-journal
RuntimeDirectory=pamsignal
ConfigurationDirectory=pamsignal
ExecStart=/usr/bin/pamsignal --foreground
Restart=on-failure
RestartSec=5s

NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
MemoryDenyWriteExecute=yes
PrivateDevices=yes
CapabilityBoundingSet=
SystemCallFilter=@system-service
SystemCallFilter=~@privileged @resources
ProtectProc=invisible

[Install]
WantedBy=multi-user.target
```

- 用 `/etc/systemd/system/` 下的**完整单元**覆盖厂商自带单元，不要用 drop-in 只赋空 `User=`——那样改不干净，还可能残留 `User=root` 之外的其它设置。
- 配置文件给 `root:systemd-journal 0640`，动态用户靠 `SupplementaryGroups=systemd-journal` 读。
- `--check-config` 也必须以**非 root 且在 systemd-journal 组**的身份跑，否则会报 `failed to load config`——那通常是权限问题，不是配置写错了。

**验证。**

```sh
systemctl is-active pamsignal
journalctl -u pamsignal --since "-5min" --no-pager -o cat | tail
```

期望看到：

```text
config loaded: … webhook=on webhook_auth=on alert_cooldown_sec=0 …
initialized successfully
daemon started, monitoring PAM events
LOGIN_SUCCESS user=… from=… port=… service=sshd auth=publickey at …
```

`LOGIN_SUCCESS` 只会在**新的**登录时出现——pamsignal 启动时用 `sd_journal_seek_tail` + `sd_journal_previous` 定位到 journal 末尾，**不回放历史**。所以装完必须**重新登录一次**才算验证，光看服务是 active 说明不了任何问题。

### 5.2 B 类：无 journald 的路由器

适用于 OpenWrt / iStoreOS 这类 `procd + busybox syslog` 的系统。上报载荷与 pamsignal **完全一致**，所以汇总端零改动。

**前置检查：**

```sh
command -v logread jq curl        # 三者都必须有
logread -f &                       # 能跟随即可
uci get system.@system[0].hostname
```

`logread` 的关键语义：**`-f` 是跟随，`-F` 是读文件**。`-f` 启动时**不回放**缓冲区（好消息：服务重启不会重刷旧事件），输出行缓冲，管道延迟约 1 秒。

**三个不能用直觉写的实现细节：**

**其一：不要用 `logread -f | while read`。**

```sh
# 错的：管道每一段都在子 shell 里，while 循环体是独立进程。
# kill -9 主进程后，子 shell 被 init 收养，继续消费旧 logread 的输出、
# 继续上报 —— 与新实例叠加就产生重复告警。
logread -f | while read -r line; do ...; done

# 对的：FIFO + exec 3<> 同时持有读写端
mkfifo "$FIFO"
exec 3<> "$FIFO"          # 既避免 open 阻塞，也让写端始终存在
logread -f > "$FIFO" 2>/dev/null &
LOGREAD_PID=$!

while IFS= read -r line <&3; do
    ...
done
```

这个坑实测复现过：`kill -9` 之后旧进程还在继续上报，你会在钉钉上看到同一次登录的两条记录，而两台机器的日志看起来都"正常"。

**其二：单实例锁要能识别陈旧锁。**

procd 的 respawn 与 `/etc/init.d/... restart` 并发时会产生多实例，各报一次。`mkdir` 是原子的，但 `SIGKILL` 无法捕获 trap 清理，所以锁里必须存 PID，靠 `/proc` 判活：

```sh
acquire_lock() {
    if mkdir "$LOCKDIR" 2>/dev/null; then
        echo $$ > "$LOCKDIR/pid"
        return 0
    fi
    _oldpid=$(cat "$LOCKDIR/pid" 2>/dev/null)
    if [ -n "${_oldpid:-}" ] && [ -d "/proc/$_oldpid" ]; then
        logger -t login-report "已有实例在运行（PID=$_oldpid），本次退出"
        return 1
    fi
    logger -t login-report "清理陈旧锁（原 PID=${_oldpid:-未知}）"
    rm -rf "$LOCKDIR"
    mkdir "$LOCKDIR" 2>/dev/null || return 1
    echo $$ > "$LOCKDIR/pid"
}
```

**其三：`PPID` 在 busybox ash 里是只读变量。**

回收孤儿 `logread -f` 时不能直接读 `$PPID`，得从 `/proc/$pid/stat` 解析：

```sh
_pp=$(sed 's/.*) //' "/proc/$_p/stat" 2>/dev/null | awk '{print $2}')
[ "${_pp:-}" = "1" ] || continue        # 只杀被 init 收养的
```

另外，判断实例数时**不能只 grep 命令行**——`ssh` 的 `bash -c` 行会自匹配自己的检查命令。要么读 `/proc/*/cmdline`，要么加 `grep -v "bash -c"`。

**日志解析。** dropbear 有两种形态：

```text
Thu Oct 29 19:10:17 2026 authpriv.notice dropbear[25737]: Pubkey auth succeeded for 'root' with ssh-rsa key SHA256:… from 192.168.1.100:55650
Thu Oct 29 18:49:01 2026 authpriv.notice dropbear[17860]: Password auth succeeded for 'root' from 192.168.1.100:54903
```

用户名在单引号里，来源在行尾的 `ip:port`。**IPv4 与 IPv6 都从最后一个冒号断开**：

```sh
_user=$(printf '%s' "$line" | sed -n "s/.*auth succeeded for '\([^']*\)'.*/\1/p")
_from=$(printf '%s' "$line" | sed -n 's/.* from \([^ ]*\)$/\1/p')
_ip=${_from%:*}
_port=${_from##*:}
case "$_port" in ''|*[!0-9]*) continue ;; esac
```

时间用**日志自带的**而不是 `date`，避免 curl 阻塞导致时间漂移。

**跨机传输：一个会吃掉你半天时间的坑。**

路由器类系统常缺 busybox applet。传输前先探测解码器：

```sh
command -v base64 uudecode openssl
```

- 有 `base64`：`base64 -d > file`
- 只有 `openssl`：`openssl base64 -d -A > file`（`-A` 读单行，配 `base64 -w0` 的单行输出）

**永远不要把解码命令的 stderr 丢弃（`2>/dev/null`）之后就当作成功**——某个 applet 不存在时它会静默写出 0 字节文件，而你看到的是"命令执行完了"。空文件的 SHA256 是个固定值：

```text
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

**看到这个哈希就是传输失败**。每次传输后都要 `sha256sum` 比对，并且比对前先 `wc -c` 确认非空。

**procd 单元：**

```sh
#!/bin/sh /etc/rc.common

USE_PROCD=1
START=95
STOP=10

start_service() {
    procd_open_instance
    procd_set_param command /bin/sh /usr/sbin/login-report
    procd_set_param respawn 3600 5 5
    procd_set_param stderr 1
    procd_close_instance
}
```

**启停与验证：**

```sh
/etc/init.d/login-report enable
/etc/init.d/login-report start
sleep 3
logread -e "login-report" | tail -3
```

期望：

```text
启动 host=<主机名>（FIFO+logread -f，回放=否）
```

新登录后应出现 `已上报 user=… from=…:… auth=publickey`。

进程树正确形态是 **1 个主进程（PPID=1）+ 1 个 `logread -f`（PPID=主进程）**。自愈验证：`kill -9 <主进程>` 后约 5 秒内 procd 应重启，日志里应出现「清理陈旧锁（原 PID=X）」+「清理孤儿 logread PID=Y」+「启动」三行。

## 六、踩过的 12 个坑

| # | 坑 | 现象 | 对策 |
|---|---|---|---|
| 1 | pamsignal **拒绝 root** | `geteuid()==0` 直接退出，服务起不来 | `DynamicUser=yes` |
| 2 | `webhook_url` **硬校验 https**，无回环例外 | 想用 `127.0.0.1` 做自监控，启动即失败 | 自监控也走公网域名 |
| 3 | `alert_cooldown_sec` 默认 60，且全局共用一个时间戳 | 4 次登录只报 2 次 | 显式设 `0` |
| 4 | `trigger.payload` 是对象属性不是 dict | `AttributeError`，或拿到空载荷 | `getattr()` 取值 |
| 5 | 主机名字段是 `host.hostname` 不是 `host.name` | 告警里主机名空白，但不报错 | 多候选兜底 |
| 6 | 仓库**没有 Makefile** | `make` 直接失败 | meson + ninja |
| 7 | `CREATE UNIQUE INDEX IF NOT EXISTS` 同名跳过 | 改去重键后行为不变 | 显式 DROP 重建 |
| 8 | 去重键缺端口 | 同秒第二次登录被静默吞掉 | 五列键含 `src_port` |
| 9 | 管道 `\| while read` 子 shell 在父进程死后继续上报 | 同一次登录推两条 | FIFO + `exec 3<>` |
| 10 | 无 `base64` applet + `2>/dev/null` 吞错 | 写成 0 字节文件却"成功" | `openssl` + SHA256 闭环 |
| 11 | `PPID` 在 busybox ash 里只读 | 孤儿回收逻辑失效 | 从 `/proc/pid/stat` 解析 |
| 12 | 装 `libsystemd-dev` 连带升级 systemd | 事后分不清失败单元从哪来 | 装前记录 `systemctl --failed` 基线 |

十二个里，第 3、7、8、9 这四条属于同一类危险：**系统不报错，只是少给你通知**。这也是为什么下面的验证清单要设计成正负对照，而不是"看一眼有没有消息"。

## 七、验证清单

按顺序执行，每步通过再进下一步。

### 7.1 端到端连通

在被控端**重新登录一次**（不是重启服务）：

```sh
# A 类
journalctl -u pamsignal --since "-2min" -o cat | grep LOGIN_SUCCESS
# B 类
logread -e "login-report" | tail -2      # 应出现 已上报 user=…
```

汇总端：

```sh
journalctl -u anotiflow --since "-5min" -o cat | grep "\[ssh_logins\]"
sqlite3 /opt/anotiflow-run/data/ssh_logins.db \
  "SELECT id, login_time_bj, src_ip, src_port, user_name, host_name
     FROM ssh_logins ORDER BY id DESC LIMIT 3;"
```

期望日志是 `stored` 且 `port` 非空，钉钉群收到即时消息。

### 7.2 北京时间正确

`login_time_bj` 与当前北京时间偏差应在分钟级内。差 8 小时就是时区没设。

### 7.3 每日汇总

临时把 `at` 改成当前时间 +2 分钟，重启 anotiflow，确认收到日报；验证后改回 `20:00` 并重启。

### 7.4 自监控不产生噪音（关键）

在汇总端另开一个 SSH 会话，检查两件事：

- 钉钉**没有**新增消息；
- `self_logins` 有新记录。

**做正负对照**，不要只看"有没有消息"：用 `grep -cF "[dingtalk] sending"` 在「已知应有推送」与「已知不应有推送」两个时间窗口分别计数，一个 ≥1、一个 =0 才算证明。

**不要**用 `grep dingtalk` 计数——`task bound: … actions=[… 'dingtalk']` 这类装配日志会在启动时打印一次，直接污染结果。

### 7.5 去重与同秒多次登录

- 同一事件重复上报 → 只 1 行（日志里是 `duplicate-skipped`）；
- 同一秒、同 IP、同用户、同主机、**不同端口**的两次登录 → **2 行**。

后者是回归重点。若旧库已存在，新版本首次连库时会自动迁移（补 `src_port` 列 + 重建 5 列唯一索引），迁移后旧数据的 `src_port` 为空属正常。

## 八、覆盖边界与安全边界

### 8.1 采集覆盖范围（必须告知使用方）

| 项 | A 类（pamsignal） | B 类（采集器） |
|---|---|---|
| SSH 成功登录 | ✅ 覆盖 | ✅ 覆盖 |
| SSH 失败尝试 | 可配，本方案未启用 | ❌ 不覆盖 |
| sudo / su / 本地登录 | ✅ PAM 事件覆盖 | ❌ syslog 里没有 PAM 事件 |
| 时间精度 | 微秒 | 秒 |
| 重启期间的事件 | 可从持久化 journal 补 | ❌ 丢失（内存流，不回放） |
| 上游来源 | 官方项目 | 自维护脚本 |

这张表建议直接写进交付文档。B 类不覆盖 `sudo`/`su` 不是实现偷懒——syslog 里根本不存在这个事件，想覆盖只能去 hook PAM，那是另一套方案。

### 8.2 安全边界

- 拥有 root 的攻击者可以停止 agent、清空 SQLite、改 `user_actions.py`。本方案解决的是「**登录发生时的秒级感知**」，**不是不可抵赖的审计**。这一点必须讲清楚，不要让使用方产生"上了这个系统就等于有合规审计"的误解。
- `AGENT_TRIGGER_TOKEN` 会出现在 uvicorn 的访问日志里（完整的 `/trigger/<token>` 路径）。缓解靠三件事叠加：只监听 `127.0.0.1`、反代强制 Bearer、该端口只放 `/trigger/*`。查日志时必须打码：

  ```sh
  journalctl -u anotiflow | sed -E 's#(/trigger/)[a-f0-9]{64}#\1<REDACTED>#g'
  ```

- `user_actions.py` 拥有 anotiflow 进程的全部权限，应为 root 可写、运行用户可读，防止被篡改后获得代码执行。
- 证书私钥 `0640 root:caddy`，不要让任何其他服务用户进 `caddy` 组。
- 令牌一旦在日志/对话/截图里暴露，是否需要轮换，判断依据应包括：日志可读范围、伪造一次上报是否**同时**需要两个凭据、公网入口是否只放 `/trigger/*`。三者都收紧的情况下，轮换的紧迫性远低于"路径 token 单独泄露"的场景。

### 8.3 未验证项

诚实记录，别假装都测过：

- 16000 字节截断路径没在真实大数据量下跑过；
- 跨午夜归属（`substr(login_time_bj,1,10)` 按天切）未测；
- 若在 20:00 之前 anotiflow 重启，内存态的定时触发点会丢当天那一次；
- 证书为手工续期，靠到期告警兜底。

## 九、日常运维速查表

| 场景 | 命令 |
|---|---|
| A 类被控端状态 | `systemctl is-active pamsignal` |
| A 类近一小时登录 | `journalctl -u pamsignal --since "-1h" -o cat \| grep LOGIN_SUCCESS` |
| B 类被控端状态 | `ubus call service list '{"name":"login-report"}' \| grep running` |
| B 类最近日志 | `logread -e login-report \| tail -5` |
| 汇总端服务状态 | `systemctl is-active anotiflow caddy pamsignal` |
| 累计登录条数 | `sqlite3 /opt/anotiflow-run/data/ssh_logins.db "SELECT COUNT(*) FROM ssh_logins;"` |
| 查访问日志（打码） | `journalctl -u anotiflow \| sed -E 's#(/trigger/)[a-f0-9]{64}#\1<REDACTED>#g'` |
| 改过 `user_actions.py` 后 | `systemctl restart anotiflow` |

最后一行要多说一句：anotiflow 的 config watcher **只监听 `config.toml`**，改 `.py` 不会自动重载。而且改完要做三处同步——本地源码副本 → 远端文件 → 重启，然后 SHA256 双向比对。忘了重启的表现是"代码明明改了，行为一点没变"，很容易怀疑人生。

## 总结

这套系统的价值不在于技术含量——每个组件都很朴素。它真正的成本在于那些"不报错的错误"：

- 冷却窗口把你真实收到的告警吃掉了；
- 去重键少一列，把同一秒的第二次登录吞了；
- 子 shell 在父进程死后还在上报，你收到重复消息；
- 解码失败的 0 字节文件，被当成传输成功。

这四类问题的共同点是**服务健康、日志干净、行为错误**。所以部署这类"只负责通知"的系统时，验证方式必须反过来设计：不要问"有没有收到通知"，而要构造「应该收到」和「不应该收到」两个对照场景，分别确认。

另外两个容易被当成理所当然、实则必须提前确认的环境前提：

1. **能不能开 80/443**。不能，就别指望 ACME http-01，也别用它当网络设计前提。
2. **被控端是 glibc 还是 musl**。是 musl，pamsignal 这条路线整条废掉，别浪费时间去修链接错误。

把这两件事在动手前问清楚，能省掉一半返工。

参考资料：

- [pamsignal（PAM login notifier）](https://github.com/anhtuank7c/pamsignal)
- [anotiflow 文档](https://github.com/anhtuank7c/anotiflow)
- [Caddy 官方文档](https://caddyserver.com/docs/)
- [systemd.exec — DynamicUser](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html)
- [OpenWrt procd init script 规范](https://openwrt.org/docs/guide-developer/procd-init-scripts)
