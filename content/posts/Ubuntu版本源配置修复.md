---
title: Ubuntu源配置修复
date: 2025-12-22 21:59:45
category: Linux
tags: Linux
index_img: /img/default.png
banner_img:

---

# 针对Ubuntu 软件源配置问题，以下是修复方案：

## 我们来创建两个修复脚本：

1. 第一个脚本 (`fix_apt_sources_noble.sh`) 是针对 **Ubuntu 24.04 (Noble)** 的。它会自动检测你的系统版本，并提供多种镜像源选项（包括阿里云、华为云、清华、中科大以及官方源），然后测试哪个源可用并应用它。

2. 第二个脚本 (`fix_apt_sources_jammy.sh`) 则是专门针对 **Ubuntu 22.04 (Jammy)** 的版本，功能类似。

---

### 1. 针对 Ubuntu 24.04 (Noble) 的优化脚本

将以下代码保存为 `fix_apt_sources_noble.sh` 并赋予执行权限 (`chmod +x fix_apt_sources_noble.sh`) 后运行。

```bash
#!/bin/bash

# 脚本名称: fix_apt_sources_noble.sh
# 功能: 自动修复 Ubuntu 24.04 (Noble) 的 APT 源配置问题
#       支持官方源及多个国内镜像源（阿里云、华为云、清华、中科大）
# 使用方法: ./fix_apt_sources_noble.sh

set -e # 遇到错误立即退出

EXPECTED_CODENAME="noble"
CURRENT_CODENAME=$(lsb_release -cs 2>/dev/null || echo "unknown")

if [[ "$CURRENT_CODENAME" != "$EXPECTED_CODENAME" ]]; then
  echo "⚠️  警告: 此脚本设计用于 Ubuntu $EXPECTED_CODENAME ($EXPECTED_CODENAME)，但检测到您的发行版代号是 '$CURRENT_CODENAME'。"
  read -p "是否继续? (y/N): " confirm && [[ $confirm == [yY] ]] || exit 1
fi

echo "🔍 开始修复 Ubuntu $EXPECTED_CODENAME 的 APT 源配置..."

# 备份当前 sources.list 文件
BACKUP_FILE="/etc/apt/sources.list.backup.$(date +%Y%m%d_%H%M%S)"
echo "📁 正在备份当前配置到 $BACKUP_FILE ..."
sudo cp /etc/apt/sources.list "$BACKUP_FILE"

# 获取系统架构
ARCH=$(dpkg --print-architecture)
echo "🖥️  检测到系统架构: $ARCH"

# 定义源列表
declare -A SOURCES=(
    ["官方源"]="http://archive.ubuntu.com/ubuntu/"
    ["阿里云"]="https://mirrors.aliyun.com/ubuntu/"
    ["华为云"]="https://mirrors.huaweicloud.com/repository/ubuntu/"
    ["清华大学"]="https://mirrors.tuna.tsinghua.edu.cn/ubuntu/"
    ["中科大"]="https://mirrors.ustc.edu.cn/ubuntu/"
)

# 创建临时 sources.list 内容
generate_source_list() {
    local base_url=$1
    cat << EOF
# Ubuntu $EXPECTED_CODENAME (noble) - $(basename "$base_url")
deb $base_url noble main restricted universe multiverse
deb $base_url noble-updates main restricted universe multiverse
deb $base_url noble-security main restricted universe multiverse
deb $base_url noble-backports main restricted universe multiverse

# 源码包（可选）
# deb-src $base_url noble main restricted universe multiverse
# deb-src $base_url noble-updates main restricted universe multiverse
# deb-src $base_url noble-security main restricted universe multiverse
# deb-src $base_url noble-backports main restricted universe multiverse
EOF
}

# 测试源的函数
test_source() {
    local url=$1
    echo "🧪 正在测试源: $url"
    # 创建临时 sources.list 文件进行测试
    generate_source_list "$url" > /tmp/test_sources.list
    # 替换为临时源以进行测试
    sudo cp /tmp/test_sources.list /etc/apt/sources.list
    
    # 执行 apt update 并捕获输出和返回值
    output=$(sudo apt update 2>&1)
    retval=$?
    
    if [ $retval -eq 0 ]; then
        echo "✅ 测试成功: $url 可用"
        return 0
    else
        echo "❌ 测试失败: $url 不可用"
        # echo "$output" # 如果需要详细错误信息可以取消注释
        return 1
    fi
}

# 主逻辑：遍历源列表进行测试
FOUND_WORKING_SOURCE=false
for name in "${!SOURCES[@]}"; do
    if test_source "${SOURCES[$name]}"; then
        FOUND_WORKING_SOURCE=true
        echo "🎉 成功找到可用源: $name (${SOURCES[$name]})"
        break
    fi
done

# 清理临时文件
rm -f /tmp/test_sources.list

# 结果处理
if [ "$FOUND_WORKING_SOURCE" = true ]; then
    echo "✅ APT 源已成功更新并验证。"
    echo "💡 如需恢复原始配置，请执行:"
    echo "   sudo mv $BACKUP_FILE /etc/apt/sources.list && sudo apt update"
else
    echo "❌ 所有预定义源均无法访问。请检查网络连接或稍后再试。"
    echo "🔄 正在恢复原始 sources.list 配置..."
    sudo mv "$BACKUP_FILE" /etc/apt/sources.list
    echo "🔄 已恢复原始配置。"
    exit 1
fi

echo "🏁 APT 源修复完成。"
```

---

### 2. 针对 Ubuntu 22.04 (Jammy) 的优化脚本

将以下代码保存为 `fix_apt_sources_jammy.sh` 并赋予执行权限 (`chmod +x fix_apt_sources_jammy.sh`) 后运行。

```bash
#!/bin/bash

# 脚本名称: fix_apt_sources_jammy.sh
# 功能: 自动修复 Ubuntu 22.04 (Jammy) 的 APT 源配置问题
#       支持官方源及多个国内镜像源（阿里云、华为云、清华、中科大）
# 使用方法: ./fix_apt_sources_jammy.sh

set -e # 遇到错误立即退出

EXPECTED_CODENAME="jammy"
CURRENT_CODENAME=$(lsb_release -cs 2>/dev/null || echo "unknown")

if [[ "$CURRENT_CODENAME" != "$EXPECTED_CODENAME" ]]; then
  echo "⚠️  警告: 此脚本设计用于 Ubuntu $EXPECTED_CODENAME ($EXPECTED_CODENAME)，但检测到您的发行版代号是 '$CURRENT_CODENAME'。"
  read -p "是否继续? (y/N): " confirm && [[ $confirm == [yY] ]] || exit 1
fi

echo "🔍 开始修复 Ubuntu $EXPECTED_CODENAME 的 APT 源配置..."

# 备份当前 sources.list 文件
BACKUP_FILE="/etc/apt/sources.list.backup.$(date +%Y%m%d_%H%M%S)"
echo "📁 正在备份当前配置到 $BACKUP_FILE ..."
sudo cp /etc/apt/sources.list "$BACKUP_FILE"

# 获取系统架构
ARCH=$(dpkg --print-architecture)
echo "🖥️  检测到系统架构: $ARCH"

# 定义源列表
# 注意 Jammy 的安全更新地址可能不同
declare -A SOURCES=(
    ["官方源"]="http://archive.ubuntu.com/ubuntu/"
    ["阿里云"]="https://mirrors.aliyun.com/ubuntu/"
    ["华为云"]="https://mirrors.huaweicloud.com/repository/ubuntu/"
    ["清华大学"]="https://mirrors.tuna.tsinghua.edu.cn/ubuntu/"
    ["中科大"]="https://mirrors.ustc.edu.cn/ubuntu/"
)

# 创建临时 sources.list 内容
# Jammy 的安全更新路径与 Noble 相同
generate_source_list() {
    local base_url=$1
    cat << EOF
# Ubuntu $EXPECTED_CODENAME (jammy) - $(basename "$base_url")
deb $base_url jammy main restricted universe multiverse
deb $base_url jammy-updates main restricted universe multiverse
deb $base_url jammy-security main restricted universe multiverse
deb $base_url jammy-backports main restricted universe multiverse

# 源码包（可选）
# deb-src $base_url jammy main restricted universe multiverse
# deb-src $base_url jammy-updates main restricted universe multiverse
# deb-src $base_url jammy-security main restricted universe multiverse
# deb-src $base_url jammy-backports main restricted universe multiverse
EOF
}

# 测试源的函数
test_source() {
    local url=$1
    echo "🧪 正在测试源: $url"
    # 创建临时 sources.list 文件进行测试
    generate_source_list "$url" > /tmp/test_sources.list
    # 替换为临时源以进行测试
    sudo cp /tmp/test_sources.list /etc/apt/sources.list

    # 执行 apt update 并捕获输出和返回值
    output=$(sudo apt update 2>&1)
    retval=$?

    if [ $retval -eq 0 ]; then
        echo "✅ 测试成功: $url 可用"
        return 0
    else
        echo "❌ 测试失败: $url 不可用"
        # echo "$output" # 如果需要详细错误信息可以取消注释
        return 1
    fi
}

# 主逻辑：遍历源列表进行测试
FOUND_WORKING_SOURCE=false
for name in "${!SOURCES[@]}"; do
    if test_source "${SOURCES[$name]}"; then
        FOUND_WORKING_SOURCE=true
        echo "🎉 成功找到可用源: $name (${SOURCES[$name]})"
        break
    fi
done

# 清理临时文件
rm -f /tmp/test_sources.list

# 结果处理
if [ "$FOUND_WORKING_SOURCE" = true ]; then
    echo "✅ APT 源已成功更新并验证。"
    echo "💡 如需恢复原始配置，请执行:"
    echo "   sudo mv $BACKUP_FILE /etc/apt/sources.list && sudo apt update"
else
    echo "❌ 所有预定义源均无法访问。请检查网络连接或稍后再试。"
    echo "🔄 正在恢复原始 sources.list 配置..."
    sudo mv "$BACKUP_FILE" /etc/apt/sources.list
    echo "🔄 已恢复原始配置。"
    exit 1
fi

echo "🏁 APT 源修复完成。"
```

### 如何使用

1.  **下载/创建脚本**: 将上面的相应代码块复制粘贴到一个新的文本文件中，并命名为 `fix_apt_sources_noble.sh` 或 `fix_apt_sources_jammy.sh`。
2.  **添加执行权限**:
    ```bash
    chmod +x fix_apt_sources_noble.sh
    # 或
    chmod +x fix_apt_sources_jammy.sh
    ```
3.  **运行脚本**:
    ```bash
    ./fix_apt_sources_noble.sh
    # 或
    ./fix_apt_sources_jammy.sh
    ```

# 这些脚本将会：
*   检查系统版本。
*   自动备份原始的 `/etc/apt/sources.list` 文件。
*   依次测试预设的不同镜像源（包括官方源）。
*   一旦发现一个可用的源，就会将其设置为新的 `sources.list` 内容。
*   如果所有源都不可用，则会回滚到原始配置。