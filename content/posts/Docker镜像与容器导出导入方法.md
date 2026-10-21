---
title: Docker镜像与容器导出导入方法
date: 2025-12-26 22:09:45
category: Docker
tags: Docker
index_img: /img/default.png
banner_img:

---

在 Docker 中，**镜像导出**和**容器导出**是两个不同的概念。

很多人在进行离线部署、服务器迁移或备份时，容易把 `docker save`、`docker load`、`docker export`、`docker import` 和 `docker commit` 混在一起使用。实际上，这几组命令处理的对象完全不同：

- `docker save` / `docker load`：用于**镜像的导出与导入**；
- `docker export` / `docker import`：用于**容器文件系统的导出与导入**；
- `docker commit`：用于把**容器当前文件系统变化保存成新的镜像**；
- `docker cp`：用于只备份或恢复**容器中的指定文件和目录**。

如果目标是完整迁移一个 Docker 应用，还需要额外处理**数据卷、端口映射、环境变量、网络、启动参数等运行配置**。

本文按照实际使用场景，详细介绍 Docker 镜像和容器的导出、导入、迁移以及常见问题。

---

## 一、先搞清楚镜像和容器的区别

Docker 的基本关系可以简单理解为：

```text
Docker 镜像
    │
    │ docker run
    ▼
Docker 容器
```

镜像是用于创建容器的只读模板，而容器是在镜像基础上运行后产生的实例。

例如：

```bash
 docker run -d --name my_nginx nginx:latest
```

这里：

```text
nginx:latest
```

是镜像，

```text
my_nginx
```

是由这个镜像创建出来的容器。

因此，备份镜像和备份容器，实际上是两个不同的问题。

---

## 二、Docker 镜像导出：`docker save`

如果目标是把一个 Docker 镜像保存成 `.tar` 文件，应使用：

```bash
docker save -o nginx.tar nginx:latest
```

也可以使用完整命令：

```bash
docker image save -o nginx.tar nginx:latest
```

两种写法功能相同。

执行完成后，会得到：

```text
nginx.tar
```

这个归档文件适合用于：

- 离线部署；
- 服务器之间迁移镜像；
- 备份镜像；
- 没有网络连接时复制镜像；
- 将多个镜像打包带到另一台 Docker 主机。

### 1. 导出多个镜像

可以一次导出多个镜像：

```bash
docker save -o docker-images.tar nginx:latest redis:7 mysql:8
```

然后目标服务器只需要执行一次：

```bash
docker load -i docker-images.tar
```

即可加载归档中的镜像。

### 2. 查看镜像

导出前可以先查看：

```bash
docker images
```

或者：

```bash
docker image ls
```

---

## 三、Docker 镜像导入：`docker load`

对于通过 `docker save` 导出的 `.tar` 文件，应使用：

```bash
docker load -i nginx.tar
```

也可以使用管道：

```bash
cat nginx.tar | docker load
```

或者：

```bash
docker load < nginx.tar
```

导入成功后一般会看到：

```text
Loaded image: nginx:latest
```

然后查看：

```bash
docker images
```

即可确认镜像是否存在。

Docker 也支持直接从压缩归档加载镜像，例如：

```bash
docker load -i nginx.tar.gz
```

当前 Docker CLI 的 `docker load` 支持从 tar 归档以及 gzip、bzip2、xz、zstd 等压缩输入加载镜像。

---

## 四、Docker 容器导出：`docker export`

如果你要导出的不是镜像，而是**某个容器当前的文件系统**，应该使用：

```bash
docker export -o container.tar my_container
```

完整形式为：

```bash
docker container export -o container.tar my_container
```

两种写法等价。

Docker 官方定义中，`docker export` 导出的是**容器的文件系统为 tar 归档**。

例如：

```bash
docker ps -a
```

假设存在：

```text
CONTAINER ID   IMAGE         COMMAND       STATUS       NAMES
abc123456789   ubuntu:24.04  "/bin/bash"   Exited       my_ubuntu
```

执行：

```bash
docker export -o my_ubuntu.tar my_ubuntu
```

即可生成：

```text
my_ubuntu.tar
```

---

## 五、运行中的容器可以执行 `docker export` 吗？

可以。

例如：

```bash
docker export -o my_container.tar my_container
```

运行中的容器和已经停止的容器都可以作为 `docker export` 的目标。

不过，如果容器正在持续写入数据库、日志或其他业务数据，直接导出可能无法得到一个适合作为一致性备份的业务数据状态。

对于数据库等重要服务，更推荐先停止业务写入或使用应用自身提供的备份机制，再备份数据卷。

---

## 六、`docker export` 最大的注意事项：不会导出数据卷

这是 Docker 容器导出中最重要的一点。

```bash
docker export -o container.tar my_container
```

**不会导出容器挂载的数据卷内容。** Docker 官方文档明确说明，关联到容器的 volume 内容不会包含在 `docker export` 结果中；如果某个 volume 挂载到了容器目录，导出的实际上是该挂载点下面原本存在于容器文件系统中的内容，而不是 volume 中的数据。

例如容器配置：

```text
容器
 ├── /etc/app
 ├── /usr/local/bin
 └── /data  → Docker Volume
               └── 数据库文件
```

执行：

```bash
docker export -o container.tar my_container
```

得到的主要是：

```text
/etc/app
/usr/local/bin
...
```

而：

```text
/data
```

对应的 volume 数据不会随 `container.tar` 一起导出。

因此：

> **不要把 `docker export` 当成完整的 Docker 容器备份方案。**

---

## 七、容器导出后如何重新导入？

通过：

```bash
docker export
```

得到的归档，应使用：

```bash
docker import
```

进行导入。

例如：

```bash
docker import my_ubuntu.tar my_ubuntu:latest
```

也可以使用完整形式：

```bash
docker image import my_ubuntu.tar my_ubuntu:latest
```

然后查看：

```bash
docker images
```

可能看到：

```text
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
my_ubuntu    latest    abcdef123456   10 seconds ago  78MB
```

此时，原来的容器文件系统已经变成了一个新的 Docker 镜像。

---

## 八、`docker export` + `docker import` 的完整示例

假设当前有一个容器：

```bash
docker ps -a
```

显示：

```text
CONTAINER ID   IMAGE          COMMAND       STATUS      NAMES
abc123456789   ubuntu:24.04   "/bin/bash"   Exited      my_ubuntu
```

### 1. 导出容器

```bash
docker export -o my_ubuntu.tar my_ubuntu
```

### 2. 将文件复制到另一台服务器

例如：

```bash
scp my_ubuntu.tar user@192.168.1.100:/tmp/
```

### 3. 导入为新镜像

在目标服务器执行：

```bash
docker import /tmp/my_ubuntu.tar my_ubuntu:latest
```

### 4. 查看镜像

```bash
docker images
```

### 5. 从新镜像创建容器

```bash
docker run -it --name my_ubuntu_new my_ubuntu:latest /bin/bash
```

这样就完成了：

```text
容器
 │
 │ docker export
 ▼
container.tar
 │
 │ docker import
 ▼
新镜像
 │
 │ docker run
 ▼
新容器
```

---

## 九、为什么 `docker export` 不能完整恢复原来的容器？

因为 `docker export` 的目标是**容器文件系统**，而不是完整的容器运行配置。

例如下面这些内容不应该认为会通过 `export/import` 自动恢复：

- 原镜像的完整层历史；
- 原容器的端口映射；
- 环境变量配置；
- 网络配置；
- 容器名称；
- 自动重启策略；
- CPU、内存等运行参数；
- Volume 挂载关系；
- 原容器对应的 Docker 启动命令参数。

因此：

```bash
docker export
```

更适合用于：

- 保存容器文件系统快照；
- 从现有容器文件系统创建一个新的基础镜像；
- 某些特殊的离线文件系统迁移场景；
- 调试和临时迁移。

如果目标是**完整迁移一个正在运行的应用容器**，通常不应该只依赖 `docker export`。

---

## 十、如何把容器当前修改保存成镜像？`docker commit`

有时候你已经运行了一个容器，并且在容器内部进行了很多修改，例如：

```bash
apt install xxx
修改配置文件
安装软件
增加脚本
修改程序配置
```

此时，可以使用：

```bash
docker commit my_container my_image:latest
```

Docker 官方将 `docker commit` 定义为：根据容器的文件变化创建一个新的镜像。默认情况下，提交镜像时 Docker 会暂停容器，以降低提交期间发生文件数据不一致的可能性。

例如：

```bash
docker commit my_nginx my_nginx_backup:2025-12-26
```

然后：

```bash
docker images
```

即可看到新镜像。

---

## 十一、`docker commit` 不会备份 Volume

虽然 `docker commit` 比 `docker export` 更接近“把容器状态保存下来”，但是它同样存在一个非常重要的限制：

> **挂载到容器中的 volume 数据不会包含在 commit 生成的镜像中。** 

例如：

```text
容器
 ├── 容器自身文件系统
 │      ├── 配置文件
 │      └── 安装的软件
 │
 └── /data → volume
              └── 数据
```

执行：

```bash
docker commit my_container backup:latest
```

保存的是容器自身文件系统的变化，而不是 `/data` volume 中的数据。

因此，在备份数据库、博客、NAS、下载器等应用时，必须单独备份 volume。

---

## 十二、使用 `docker commit` + `docker save` 迁移容器修改

如果你的需求是：

> “我已经在一个容器里面手动安装、修改了很多东西，现在想把这个状态带到另一台 Docker 服务器。”

可以使用：

```text
docker commit
      ↓
创建新镜像
      ↓
docker save
      ↓
保存为 tar
      ↓
复制到目标服务器
      ↓
docker load
      ↓
恢复镜像
      ↓
docker run
```

例如：

### 1. 将容器保存为镜像

```bash
docker commit my_container my_app:backup
```

### 2. 导出镜像

```bash
docker save -o my_app.tar my_app:backup
```

### 3. 复制到目标服务器

```bash
scp my_app.tar user@192.168.1.100:/tmp/
```

### 4. 目标服务器加载镜像

```bash
docker load -i /tmp/my_app.tar
```

### 5. 创建新容器

```bash
docker run -d --name my_app my_app:backup
```

这种方式比单纯使用 `docker export` 更适合“保存容器当前修改后继续作为 Docker 镜像使用”的场景。

---

## 十三、镜像迁移和容器迁移应该怎么选？

可以按照下面的思路选择。

| 需求 | 推荐方法 |
|---|---|
| 迁移原始 Docker 镜像 | `docker save` + `docker load` |
| 离线部署镜像 | `docker save` + `docker load` |
| 导出容器文件系统 | `docker export` |
| 从容器文件系统创建新镜像 | `docker export` + `docker import` |
| 保存容器当前文件系统修改 | `docker commit` |
| 将容器修改迁移到另一台机器 | `docker commit` + `docker save` + `docker load` |
| 只备份容器里的某个目录 | `docker cp` |
| 备份 Docker Volume | 单独备份 volume |
| 完整迁移一个应用 | 镜像 + Volume + 运行配置 |

简单来说：

```text
镜像迁移：

docker save → docker load
```

```text
容器文件系统迁移：

docker export → docker import
```

```text
容器修改保存成镜像：

docker commit → docker save → docker load
```

---

## 十四、如何备份 Docker Volume？

由于 `docker export` 和 `docker commit` 都不会把挂载的 Volume 内容包含进去，因此重要数据需要单独备份。

假设存在 Volume：

```bash
docker volume ls
```

例如：

```text
DRIVER    VOLUME NAME
local     mysql_data
```

可以使用临时容器将 Volume 打包：

```bash
docker run --rm \
  -v mysql_data:/data \
  -v "$PWD":/backup \
  alpine \
  tar czf /backup/mysql_data.tar.gz -C /data .
```

执行完成后当前目录会得到：

```text
mysql_data.tar.gz
```

这就是 Volume 数据备份文件。

---

## 十五、恢复 Docker Volume 数据

先创建 Volume：

```bash
docker volume create mysql_data
```

然后恢复：

```bash
docker run --rm \
  -v mysql_data:/data \
  -v "$PWD":/backup \
  alpine \
  tar xzf /backup/mysql_data.tar.gz -C /data
```

恢复完成后，再启动对应的应用容器。

对于 MySQL、PostgreSQL、Redis 等数据库类应用，建议优先使用数据库自身提供的逻辑备份机制，再结合 Volume 备份作为额外保障。

---

## 十六、只备份容器中的某些文件：`docker cp`

如果并不需要导出整个容器，而只想复制某个配置目录，可以使用：

```bash
docker cp my_container:/etc/nginx ./nginx-config
```

例如备份配置文件：

```bash
docker cp my_nginx:/etc/nginx/nginx.conf ./nginx.conf
```

也可以把宿主机文件复制回容器：

```bash
docker cp ./nginx.conf my_nginx:/etc/nginx/nginx.conf
```

Docker 官方的 `docker cp` 支持在运行中或已停止的容器和宿主机之间复制文件或目录。

这种方式特别适合备份：

- 配置文件；
- SSL 证书；
- 网站文件；
- Shell 脚本；
- 应用程序配置目录。

---

## 十七、备份容器运行参数

如果你准备迁移一个完整的应用，仅保存镜像还不够。

建议先保存容器的详细配置：

```bash
docker inspect my_container > my_container-inspect.json
```

Docker 官方提供 `docker container inspect` 用于查看容器详细信息。

可以重点检查：

```text
Env
Cmd
Entrypoint
ExposedPorts
HostConfig
Binds
Mounts
PortBindings
RestartPolicy
NetworkSettings
```

例如：

```bash
docker inspect my_container
```

可以查看端口映射、挂载目录、环境变量、网络以及运行参数等信息。

不过，`inspect` 输出更适合用于**记录和核对配置**，并不能简单地通过：

```bash
docker run $(cat my_container-inspect.json)
```

直接恢复一个容器。

实际迁移时，更推荐使用 Docker Compose 管理应用运行配置。

---

## 十八、使用 Docker Compose 管理完整应用

如果一个应用包含多个服务，例如：

```text
Nginx
MySQL
Redis
应用程序
```

单纯使用 `docker export` 或 `docker save` 都无法完整记录整个应用的运行关系。

更推荐使用 `compose.yaml`：

```yaml
services:
  app:
    image: my_app:latest
    container_name: my_app
    ports:
      - "8080:8080"
    volumes:
      - app_data:/data
    restart: unless-stopped

volumes:
  app_data:
```

此时迁移时可以分别处理：

```text
compose.yaml
     +
Docker 镜像
     +
Docker Volume 数据
     ↓
目标服务器
```

这样比单独备份一个运行中的容器更加可靠，也更容易重复部署。

---

## 十九、完整 Docker 容器迁移方案

如果你的目标是把一台服务器上的 Docker 应用完整迁移到另一台服务器，推荐按照以下流程处理。

### 第一步：确定容器使用的镜像

```bash
docker inspect my_container \
  --format '{{.Config.Image}}'
```

例如：

```text
nginx:latest
```

### 第二步：导出镜像

```bash
docker save -o nginx.tar nginx:latest
```

### 第三步：备份 Volume

查看挂载：

```bash
docker inspect my_container \
  --format '{{json .Mounts}}'
```

如果使用了 Volume，则单独备份 Volume 数据。

### 第四步：保存容器配置

```bash
docker inspect my_container > my_container-inspect.json
```

### 第五步：保存 Compose 文件

如果应用使用 Docker Compose，直接备份：

```text
compose.yaml
.env
```

以及其他相关配置文件。

### 第六步：复制文件到目标服务器

例如：

```bash
scp nginx.tar user@192.168.1.100:/opt/backup/
scp my_container-inspect.json user@192.168.1.100:/opt/backup/
scp compose.yaml user@192.168.1.100:/opt/backup/
```

### 第七步：目标服务器导入镜像

```bash
docker load -i /opt/backup/nginx.tar
```

### 第八步：恢复 Volume

根据实际 Volume 名称创建并恢复数据。

### 第九步：恢复容器

使用原来的 Compose 文件或者根据原配置重新执行 `docker run`。

最终结构应为：

```text
镜像
  │
  ├── image.tar
  │       │
  │       └── docker load
  │
  ├── Volume 数据
  │       │
  │       └── 恢复 Volume
  │
  └── Compose / 运行参数
          │
          └── docker compose up -d
```

---

## 二十、压缩 Docker 镜像和容器归档

`.tar` 文件通常比较大，可以进行 gzip 压缩。

例如：

```bash
gzip nginx.tar
```

得到：

```text
nginx.tar.gz
```

也可以导出后直接压缩：

```bash
docker save nginx:latest | gzip > nginx.tar.gz
```

恢复时：

```bash
docker load -i nginx.tar.gz
```

容器文件系统也可以直接压缩：

```bash
docker export my_container | gzip > my_container.tar.gz
```

导入时：

```bash
gunzip -c my_container.tar.gz | docker import - my_container:latest
```

---

## 二十一、检查导出的 `.tar` 文件

对于普通 tar 文件，可以使用：

```bash
tar -tf nginx.tar
```

查看归档内容。

也可以：

```bash
tar -tvf nginx.tar
```

如果出现：

```text
Unexpected EOF in archive
```

或者：

```text
unexpected end of file
```

通常需要检查文件是否在传输过程中损坏或没有完整写入。

对于镜像归档，更推荐直接进行一次测试加载：

```bash
docker load -i nginx.tar
```

对于容器归档，可以测试：

```bash
docker import nginx-container.tar testimage:latest
```

---

## 二十二、跨平台迁移时检查镜像架构

进行 Docker 离线迁移时，还应该确认 CPU 架构。

可以查看镜像架构：

```bash
docker image inspect nginx:latest \
  --format '{{.Os}}/{{.Architecture}}'
```

常见架构包括：

```text
linux/amd64
linux/arm64
linux/arm/v7
```

查看当前主机架构：

```bash
uname -m
```

例如：

```text
x86_64
```

通常对应：

```text
linux/amd64
```

需要注意：

> 镜像能够成功 `docker load`，并不意味着它一定能够在目标主机上正常运行。

跨 CPU 架构迁移时，应确认目标平台是否存在对应镜像架构，或者是否配置了合适的架构模拟环境。

---

## 二十三、常见问题

### 1. `docker load` 和 `docker import` 有什么区别？

`docker load` 用于加载通过 `docker save` 导出的 Docker 镜像归档，并恢复镜像及标签。

```bash
docker save nginx:latest -o nginx.tar
docker load -i nginx.tar
```

`docker import` 则是从 tar 文件中的文件系统内容创建一个新的镜像，对应的典型来源是 `docker export`。

```bash
docker export my_container -o container.tar
docker import container.tar my_container:latest
```

### 2. `docker export` 能不能备份 Volume？

不能。

Volume 必须单独备份。

### 3. `docker commit` 能不能备份 Volume？

不能。

Docker 官方明确说明，commit 不包含挂载 Volume 中的数据。

### 4. 为什么 `export/import` 后原来的端口映射没有了？

因为 `docker export` 导出的重点是容器文件系统，而不是完整的容器运行配置。

导入后创建容器时，需要重新指定，例如：

```bash
docker run -d \
  --name my_app \
  -p 8080:80 \
  my_app:latest
```

### 5. 为什么导入后的镜像和原镜像大小不同？

因为 `docker export` 和 `docker import` 的处理对象是容器文件系统，不是原镜像的分层结构。因此不要用 `export/import` 来等价替代 `save/load`。

### 6. 容器运行时修改了配置，如何带到另一台服务器？

推荐：

```bash
docker commit my_container my_app:backup
docker save -o my_app.tar my_app:backup
```

然后在目标服务器：

```bash
docker load -i my_app.tar
```

但 Volume 数据仍然需要单独迁移。

---

## 二十四、Docker 镜像与容器导出命令速查

| 操作 | 命令 |
|---|---|
| 查看镜像 | `docker images` |
| 导出镜像 | `docker save -o image.tar image:tag` |
| 导入镜像 | `docker load -i image.tar` |
| 导出容器 | `docker export -o container.tar container` |
| 导入容器文件系统 | `docker import container.tar image:tag` |
| 容器保存为镜像 | `docker commit container image:tag` |
| 复制容器文件 | `docker cp container:/path ./path` |
| 查看容器配置 | `docker inspect container` |
| 查看容器修改 | `docker diff container` |
| 查看 Volume | `docker volume ls` |
| 创建 Volume | `docker volume create volume_name` |

---

## 二十五、最推荐的迁移方式

根据实际需求，可以按照下面的方法选择。

### 场景一：只迁移 Docker 镜像

```bash
# 源服务器
docker save -o image.tar image:tag

# 目标服务器
docker load -i image.tar
```

这是最标准的镜像离线迁移方式。

### 场景二：只需要导出容器文件系统

```bash
docker export -o container.tar container
```

目标服务器：

```bash
docker import container.tar image:tag
```

### 场景三：保存容器当前修改

```bash
docker commit container image:backup
```

然后：

```bash
docker save -o image.tar image:backup
```

目标服务器：

```bash
docker load -i image.tar
```

### 场景四：完整迁移一个应用

推荐采用：

```text
Docker 镜像
    +
Docker Volume 数据
    +
compose.yaml / 运行参数
    +
.env / 配置文件
    ↓
目标服务器
```

而不是单独使用：

```bash
docker export
```

---

## 二十六、总结

Docker 中与导出、导入相关的几个核心命令可以这样理解：

```text
                    Docker
                       │
          ┌────────────┴────────────┐
          │                         │
        镜像                       容器
          │                         │
   docker save/load        docker export/import
          │                         │
    保留镜像信息              导出文件系统
          │                         │
       迁移镜像             创建新的文件系统镜像
```

另外还有：

```text
docker commit
      │
      ▼
将容器当前文件系统变化保存成新镜像
      │
      ▼
docker save
      │
      ▼
导出为 tar
      │
      ▼
docker load
```

最值得记住的是下面四条：

```bash
# 镜像 → tar
docker save -o image.tar image:tag

# tar → 镜像
docker load -i image.tar

# 容器 → tar
docker export -o container.tar container

# tar → 新镜像
docker import container.tar image:tag
```

如果需要迁移一个完整的 Docker 应用，则不要只备份容器本身，而应该至少同时考虑：

```text
镜像
+
Volume 数据
+
端口映射
+
环境变量
+
启动命令
+
网络配置
+
Compose 配置
```

因此，对于日常生产环境和服务器迁移，比较推荐的思路是：

> **镜像使用 `docker save/load` 迁移，数据使用 Volume 或数据库自身的备份机制处理，应用运行配置使用 Docker Compose 管理。**

这样比单独使用 `docker export/import` 更适合作为长期、可重复的 Docker 备份与迁移方案。

---

## 二十七、参考资料

- Docker `docker container export`：https://docs.docker.com/reference/cli/docker/container/export/
- Docker `docker container commit`：https://docs.docker.com/reference/cli/docker/container/commit/
- Docker `docker image load`：https://docs.docker.com/reference/cli/docker/image/load/
- Docker `docker image` CLI：https://docs.docker.com/reference/cli/docker/image/
- Docker `docker container cp`：https://docs.docker.com/reference/cli/docker/container/cp/
