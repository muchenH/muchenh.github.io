---
title: 如何在Windows上安装和管理多版本 Python
date: 2026-08-28 11:09:45
category: 
- Python 
- Windows
tags: 
- Python 
- Windows
index_img: /img/default.png
banner_img:

---
### Windows 10 使用 pyenv-win 安装和管理多版本 Python 完整方案

### 一、系统要求和准备工作

**系统要求：**
- Windows 10 或更高版本
- PowerShell 5.1+（Windows 10 自带）
- 管理员权限（部分步骤需要）
- 网络连接（用于下载 Python 版本）

**准备工作：**
1. 卸载现有的 Python 安装（可选但推荐）
2. 备份现有的环境变量 PATH 中与 Python 相关的路径
3. 确保有足够的磁盘空间（每个 Python 版本约 100-200MB）

### 二、安装 pyenv-win

#### 方法1：使用 PowerShell 安装（推荐）

```powershell
# 1. 以管理员身份打开 PowerShell
# 2. 安装 Chocolatey（Windows 包管理器）
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 3. 使用 Chocolatey 安装 pyenv-win
choco install pyenv-win

# 4. 或者使用独立安装脚本
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1" -OutFile "./install-pyenv-win.ps1"
.\install-pyenv-win.ps1
```

#### 方法2：手动安装

```powershell
# 1. 克隆 pyenv-win 仓库
git clone https://github.com/pyenv-win/pyenv-win.git "$HOME\.pyenv"

# 2. 设置环境变量（系统级）
# 打开 "系统属性" → "高级" → "环境变量"
# 新建系统变量：PYENV = %USERPROFILE%\.pyenv\pyenv-win
# 编辑 PATH 变量，添加：%PYENV%\bin
# 重启 PowerShell 使生效
```

### 三、配置环境变量

安装完成后，需要配置环境变量：

```powershell
# 检查当前环境变量
$env:Path

# 确保以下路径在 PATH 中：
# C:\Users\您的用户名\.pyenv\pyenv-win\bin
# C:\Users\您的用户名\.pyenv\pyenv-win\shims

# 如果不在，手动添加：
$env:PYENV = "$HOME\.pyenv\pyenv-win"
$env:Path = "$env:PYENV\bin;$env:PYENV\shims;$env:Path"

# 永久生效，添加到用户环境变量：
[Environment]::SetEnvironmentVariable("PYENV", "$env:UserProfile\.pyenv\pyenv-win", "User")
[Environment]::SetEnvironmentVariable("Path", "$env:UserProfile\.pyenv\pyenv-win\bin;$env:Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$env:UserProfile\.pyenv\pyenv-win\shims;$env:Path", "User")
```

### 四、基本命令使用

#### 1. 查看可安装的 Python 版本
```powershell
pyenv install --list
# 或查看特定版本
pyenv install --list | findstr "3.8"
```

#### 2. 安装 Python 版本
```powershell
# 安装指定版本（如 Python 3.9.0）
pyenv install 3.9.0

# 安装多个版本
pyenv install 3.8.0
pyenv install 3.10.0
pyenv install 3.11.0
pyenv install 3.12.0
```

**注意：** 如果下载缓慢，可以设置镜像源：
```powershell
# 设置淘宝镜像加速
$env:PYTHON_BUILD_MIRROR_URL = "https://npm.taobao.org/mirrors/python"
# 或使用官方镜像
$env:PYTHON_BUILD_MIRROR_URL = "https://www.python.org/ftp/python"
```

#### 3. 查看已安装的版本
```powershell
pyenv versions
# 输出示例：
# * system (set by C:\Users\username\.pyenv\pyenv-win\version)
#   3.8.0
#   3.9.0
#   3.10.0
```

#### 4. 设置全局 Python 版本
```powershell
# 设置全局默认版本
pyenv global 3.9.0

# 验证设置
python --version
pip --version
```

#### 5. 设置局部（项目）Python 版本
```powershell
# 进入项目目录
cd D:\myproject

# 设置该目录使用特定 Python 版本
pyenv local 3.8.0

# 这会创建一个 .python-version 文件
# 查看当前目录使用的版本
pyenv version
```

#### 6. 切换回系统 Python 版本
```powershell
pyenv global system
# 或删除局部设置
pyenv local --unset
```

### 五、高级管理功能

#### 1. 卸载 Python 版本
```powershell
pyenv uninstall 3.8.0
```

#### 2. 更新 pyenv-win
```powershell
# 方法1：通过 Chocolatey
choco upgrade pyenv-win

# 方法2：手动更新
cd $HOME\.pyenv
git pull
```

#### 3. 清理缓存和安装文件
```powershell
# 清理下载缓存
pyenv rehash

# 查看缓存位置
pyenv prefix
```

#### 4. 设置虚拟环境（配合 virtualenv）
```powershell
# 安装 virtualenv
pip install virtualenv

# 创建虚拟环境（指定 Python 版本）
pyenv local 3.9.0
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate

# 退出虚拟环境
deactivate
```

### 六、常见问题解决

#### 问题1：安装 Python 版本时下载失败
**解决方案：**
```powershell
# 1. 手动下载 Python 安装包
# 访问：https://www.python.org/downloads/windows/
# 下载对应版本的 .exe 安装文件

# 2. 将下载的文件放入 pyenv 缓存目录
# 默认位置：%USERPROFILE%\.pyenv\pyenv-win\install_cache

# 3. 重试安装
pyenv install 3.9.0
```

#### 问题2：命令未找到或无法识别
**解决方案：**
```powershell
# 1. 确保环境变量配置正确
echo $env:PYENV
echo $env:Path

# 2. 重新加载 profile
. $PROFILE

# 3. 重启 PowerShell
```

#### 问题3：Python 版本切换不生效
**解决方案：**
```powershell
# 1. 检查当前目录是否有 .python-version 文件
Get-ChildItem -Filter ".python-version" -Recurse

# 2. 重新执行 rehash
pyenv rehash

# 3. 检查 PATH 中 shims 目录的顺序
# shims 目录应该在 PATH 的最前面
```

### 七、最佳实践建议

1. **版本管理策略：**
   - 使用 `pyenv global` 设置一个最新的稳定版本作为默认
   - 为每个项目使用 `pyenv local` 设置特定版本
   - 保持旧的 Python 版本用于兼容性测试

2. **虚拟环境使用：**
   - 为每个项目创建独立的虚拟环境
   - 使用 `requirements.txt` 或 `pyproject.toml` 管理依赖
   - 定期更新依赖版本

3. **性能优化：**
   - 定期清理不需要的 Python 版本
   - 使用镜像源加速下载
   - 保持 pyenv-win 更新到最新版

### 八、常用命令速查表

| 命令 | 描述 |
|------|------|
| `pyenv versions` | 查看所有已安装版本 |
| `pyenv version` | 查看当前使用的版本 |
| `pyenv install <version>` | 安装指定版本 |
| `pyenv uninstall <version>` | 卸载指定版本 |
| `pyenv global <version>` | 设置全局版本 |
| `pyenv local <version>` | 设置局部版本 |
| `pyenv rehash` | 刷新 shims |
| `pyenv which python` | 查看当前 python 路径 |
| `pyenv help` | 查看帮助 |

### 总结

通过 pyenv-win，您可以在 Windows 10 上轻松管理多个 Python 版本，无需担心版本冲突和环境变量混乱。建议从安装最新的 Python 3.12 或 3.11 版本开始，然后根据项目需求安装其他特定版本。记得为每个项目创建虚拟环境，这样可以确保依赖包的隔离和管理。

参考资料：
- [pyenv-win GitHub 仓库](https://github.com/pyenv-win/pyenv-win)
- [pyenv-win 官方安装文档](https://pyenv-win.github.io/pyenv-win/docs/installation.html)
- [Windows 系统安装 pyenv](https://blog.csdn.net/qq_37547964/article/details/161143312)

按照这个方案，您可以开始在 Windows 10 上使用 pyenv-win 高效地管理多个 Python 版本了！