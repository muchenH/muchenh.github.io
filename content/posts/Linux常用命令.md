---
title: Linux常用命令速查
date: 2026-09-21 13:37:15
category: Linux
tags: Linux
index_img: /img/default.png
banner_img:
---

# Linux 常用命令速查

> 按用途分组的常用 Linux 命令速查表，保留各命令的原始文档结构（命令名 === + 补充说明 / 语法 / 选项 / 实例 / 注意 / 参考链接），并对冗长内容做了精简。
> 来源：`Linux命令/` 目录下各独立命令文档（ls、cat、ps、git、systemctl、chmod、cp、mv、find、df、free、tar、curl、wget、mkdir、rm、tail、head、top、sudo、du、ln、touch、diff、ssh、sort、uniq、wc、kill、egrep、pwd、man、ping、netstat、ss）。

## 目录

- [一、文件与目录管理](#section-file) — `ls` `pwd` `mkdir` `rm` `cp` `mv` `ln` `touch` `find`
- [二、内容查看与处理](#section-content) — `cat` `head` `tail` `grep/egrep` `diff` `sort` `uniq` `wc`
- [三、系统信息](#section-system) — `ps` `top` `df` `free` `du` `systemctl`
- [四、网络](#section-network) — `ssh` `curl` `wget` `ping` `netstat` `ss` `nmcli`
- [五、压缩与归档](#section-compression) — `tar`
- [六、权限管理](#section-permission) — `chmod`
- [七、进程管理](#section-process) — `kill`
- [八、版本控制](#section-version-control) — `git`
- [九、帮助与权限提升](#section-help) — `sudo` `man`

---

## 一、文件与目录管理 <a id="section-file"></a>

### ls

列出目录 contents 及文件属性。

补充说明

`ls` 命令用于列出目标目录中所含内容（子目录与文件），并可选列出文件属性（如大小、时间、权限等）。`ls` 默认在当前目录查找，若目标为目录则递归列出其下内容。

语法

```shell
ls [-aAdFhLlmNnrRsstwX] [文件/目录名]
```

常用选项

```shell
-a  列出全部文件（含隐藏文件，以 . 开头）
-A  列出全部文件（不含 . 与 ..）
-d  仅列出目录本身，不列出内容（配合 -l 查看目录权限）
-F  为不同类型追加标识：目录 /、符号链接 @、可执行文件 *
-l  长格式列出（权限、链接数、所有者、组、大小、修改时间）
-h  人类易读的文件大小（配合 -l）
-R  递归列出子目录
-S  按文件大小排序
-t  按修改时间排序（最新在前）
-u  配合 -l 按访问时间排序
-r  反向排序
-R  递归
```

常见用法

```shell
ls                    # 列出当前目录内容
ls -l                 # 列出详细文件列表
ls -lh                # 详细列表 + 人类可读大小
ls -la                # 含隐藏文件的详细列表
ls -ld /usr           # 仅查看 /usr 目录本身的权限
ls -lt                # 按时间排序，最近修改的在前
ls -lSh               # 按大小排序
ls *.txt              # 列出匹配模式的文件
ls -1                 # 每行一个文件名（便于脚本处理）
```

参考链接

- [命令网 ls](http://www.w3csky.com/linux/linux-command-ls.html)

---

### pwd

显示当前工作目录的绝对路径。

补充说明

`pwd`（print working directory）用于显示用户当前所在工作目录（以绝对路径显示）。

```shell
pwd [-LP]        # bash 内建命令
pwd [OPTION]...  # GNU coreutils 外部命令
```

选项

```shell
-L, --logical  打印环境变量 "$PWD" 的值，可能为符号链接（默认值）
-P, --physical 打印当前工作目录的物理位置（外部命令默认值）
--help         显示帮助信息并退出
--version      显示版本信息并退出
```

常见用法

```shell
pwd                     # 查看当前所在路径 → /var
cd /var/                # 进入目录，其中 mail 是软链接 -> spool/mail
pwd                     # 默认显示连接文件全路径 → /var/mail
pwd -P                  # 显示软链接最终指向的真实路径 → /var/spool/mail
```

参考链接

- [命令网 pwd](http://www.w3csky.com/linux/linux-command-pwd.html)

---

### mkdir

创建目录。

补充说明

`mkdir` 命令用于创建目录（英文 make directory）。默认仅创建指定的单层目录；若目标目录的父目录不存在，需加 `-p` 自动创建父目录。

语法

```shell
mkdir [-m权限] [-p/创建多级目录] [目录名]
```

常见用法

```shell
mkdir test              # 创建 test 目录
mkdir -p /tmp/a/b/c     # 创建多级目录（自动创建中间目录）
mkdir -m 777 test       # 创建时设定权限为 777
mkdir test1 test2 test3 # 一次创建多个目录
```

参考链接

- [命令网 mkdir](http://www.w3csky.com/linux/linux-command-mkdir.html)

---

### rm

删除文件或目录。

补充说明

`rm` 命令用于删除文件或直接删除非空目录（英文 remove）。默认删除单个文件；删除目录需配合 `-r`（递归），删除空目录配合 `-d`。

语法

```shell
rm [-fiIr] 文件或目录
```

选项

```shell
-f  强制删除（忽略不存在的文件，不提示）
-i  交互模式，删除前逐一确认
-r  递归删除目录及其内容
-d  将目录作为文件删除（删除空目录）
```

常见用法

```shell
rm test.txt                 # 删除文件（提示确认）
rm -f test.txt              # 强制删除，不提示
rm -rf test/                # 递归删除整个目录（谨慎使用）
rm -rf /tmp/*               # 删除 /tmp 下所有内容
rm -i *.log                 # 逐个确认再删除 .log 文件
```

参考链接

- [命令网 rm](http://www.w3csky.com/linux/linux-command-rm.html)

---

### cp

复制文件或目录。

补充说明

`cp` 命令用于复制文件或目录（英文 copy）。源文件可为一个或多个，目标为单一文件时所有源复制到该目录；目标为目录时复制到其下。

语法

```shell
cp [-airbdfgprsuxX] 源文件 目标文件
```

选项

```shell
-a  复制（保留权限、时间戳等，类似 -dr）
-r  递归复制目录及子目录
-d  保留符号链接本身而非复制目标
-f  强制覆盖
-i  覆盖前确认
-p  保留原始权限、所有者、时间戳等属性
-r  递归处理目录
-u  仅当源文件比目标新时才复制（更新）
```

常见用法

```shell
cp file1 file2              # 复制 file1 为 file2（或重命名）
cp -r dir1 dir2             # 递归复制目录
cp -a dir1 dir2             # 完整保留属性复制目录（备份常用）
cp -u file1 dir2            # 仅更新 dir2 中较新的文件
cp -i file1 file2           # 覆盖前提示确认
```

参考链接

- [命令网 cp](http://www.w3csky.com/linux/linux-command-cp.html)

---

### mv

移动或重命名文件。

补充说明

`mv` 命令用于移动或重命名文件、目录、符号链接（英文 move）。源与目标可为一个或多个；目标为目录时移入其中。语法

```shell
mv [-fiv] SOURCE... DIRECTORY
```

常用选项

```shell
-f  强制覆盖，不提示
-i  覆盖前提示确认
-n  不覆盖已存在的文件
-t  指定目标目录
-v  显示详细过程
```

常见用法

```shell
mv file1 file2              # 重命名 file1 为 file2
mv file1 /home/             # 将 file1 移入 /home/
mv dir1 dir2                # 将 dir1 移入 dir2 下
mv -f file1 /home/file1     # 强制移动，覆盖同名文件
mv -i file1 /home/          # 移动前提示确认
mv -v *.txt /backup/        # 详细列出移动的 .txt 文件
```

参考链接

- [命令网 mv](http://www.w3csky.com/linux/linux-command-mv.html)

---

### ln

为文件创建链接。

补充说明

`ln` 命令用于为文件创建链接（英文 link）。默认创建硬链接；加 `-s` 创建符号链接（软链接）。语法

```shell
ln [-abFnis] 源文件 目标文件
```

选项

```shell
-a  保持符号链接状态
-b  为覆盖目标创建备份（同 --backup）
-F  目标存在时强制创建，并移除冲突项
-f  强制创建链接
-i  覆盖前提示确认
-n  将符号链接指向目标本身而非其所在目录
-s  创建符号链接（软链接）
```

常见用法

```shell
ln source target                 # 创建硬链接
ln -s source target              # 创建符号链接（软链接）
ln -sf source target             # 强制创建符号链接（覆盖已有）
ln -s /path/to/repo ~/.link      # 将路径软链接到主目录
```

参考链接

- [命令网 ln](http://www.w3csky.com/linux/linux-command-ln.html)

---

### touch

创建空文件或更新修改时间。

补充说明

`touch` 命令用于创建空文件或修改已有文件的访问/修改时间（英文 touch）。若文件不存在则创建一个 0 长度空文件；若存在则更新其时间戳为当前时间。

语法

```shell
touch [选项] 文件
```

常用选项

```shell
-a  仅修改访问时间（atime）
-m  仅修改修改时间（mtime）
-t STAMP 使用指定时间（[[CC]YY]MMDDhhmm[.ss]）
-c  目标已存在则不创建、不报错
-d DATE 使用指定日期时间字符串
```

常见用法

```shell
touch file.txt                 # 创建空文件 file.txt（不存在时）
touch a.txt b.txt              # 一次创建多个空文件
touch -c file.txt              # 不创建不存在的文件
touch -d "2023-01-01" file.txt # 将修改时间设为指定日期
touch -a file.txt              # 仅更新访问时间
```

参考链接

- [命令网 touch](http://www.w3csky.com/linux/linux-command-touch.html)

---

### find

在指定目录下查找文件。

补充说明

`find` 命令用来在指定目录下查找文件。位于参数之前的字符串视为欲查找的目录名；不设置参数则在当前目录查找子目录与文件并全部显示。

语法

```shell
find [路径] [表达式]
```

常用选项（部分）

```shell
-name <样式>      按文件名匹配（支持通配符）
-iname <样式>     忽略大小写匹配文件名
-type <类型>      按文件类型查找（见下方类型表）
-size ±N[unit]    按文件大小匹配（+大于 / -小于 / 等于）
-mtime/atime/ctime N  按修改/访问/变更时间（天）查找
-mmin/amin/cmin N     按分钟查找
-perm <数值>      按权限数值查找
-user <用户>      按所有者查找
-group <组>       按所属组查找
-newer <文件>     查找比指定文件更新者
-exec cmd {} \;   对匹配结果执行命令
-ok cmd {} \;     同 -exec，执行前逐一确认
-maxdepth N       限制最大搜索深度
-mindepth N       限制最小搜索深度
-empty            查找空文件或空目录
-prune            跳过指定目录
```

**文件类型参数表：**

```shell
f  普通文件    l  符号链接    d  目录
c  字符设备    b  块设备      s  套接字   p  Fifo
```

常见用法

```shell
find .                                  # 列出当前目录及子目录所有内容
find /home -name "*.txt"                # /home 下查找 .txt 文件
find /home -iname "*.txt"               # 忽略大小写
find . \( -name "*.txt" -o -name "*.pdf" \)  # 匹配多种后缀
find /home ! -name "*.txt"              # 否定：非 .txt 文件
find . -maxdepth 3 -type f              # 最大深度 3 的普通文件
find . -type f -atime -7                # 7 天内被访问过的文件
find . -type f -size +10k               # 大于 10KB 的文件
find . -type f -perm 777                # 权限为 777 的文件
find . -type f -user tom                # 用户 tom 拥有的文件
find . -type f -name "*.log" -mtime +30 -exec cp {} old \;  # 30 天前的日志移到 old
find . -name "*.txt" -delete            # 删除匹配的 .txt 文件
find . -path "./sk" -prune -o -name "*.txt" -print  # 跳过 sk 目录
find . -empty                           # 列出长度为零的文件
```

**类型参数：** 起始目录，查找的根路径。

参考链接

- [命令网 find](http://www.w3csky.com/linux/linux-command-find.html)

---

## 二、内容查看与处理 <a id="section-content"></a>

### cat

查看文件内容。

补充说明

`cat` 命令用于读取并输出文件内容（英文 concatenate，连接）。可一次性查看整个文件，也可配合重定向将多个文件合并。

语法

```shell
cat [-abEnTv] 文件...
```

选项

```shell
-b  对非空输出行编号
-n  对所有输出行编号（含空行）
-E  在每行末尾显示 $ 符号
-T  显示 Tab 符为 ^I
-v  显示不可见字符（Tab 除外）
-e  等价于 -vT
-s  压缩连续空行为一个
```

常见用法

```shell
cat file.txt                    # 查看文件内容
cat -n file.txt                 # 显示行号
cat -b file.txt                 # 仅对非空行编号
cat file1.txt file2.txt > out.txt  # 合并两个文件到 out.txt
cat > new.txt                   # 从键盘输入创建文件（Ctrl+D 结束）
cat -A file.txt                 # 显示行尾与 Tab（调试隐藏字符）
```

参考链接

- [命令网 cat](http://www.w3csky.com/linux/linux-command-cat.html)

---

### head

查看文件开头内容。

补充说明

`head` 命令用于查看文件开头部分（英文 head，头部）。默认输出前 10 行；也可指定行数或字节数。

语法

```shell
head [-bcn] 文件
head -c <字节数> 文件
```

选项

```shell
-b  按字节计数（配合 -n）
-c <字节数>  只输出前 N 个字节
-n <行数>  只输出前 N 行（默认 10）
```

常见用法

```shell
cat file.txt                    # 查看文件内容
cat -n file.txt                 # 显示行号
cat -b file.txt                 # 仅对非空行编号
cat file1.txt file2.txt > out.txt  # 合并两个文件到 out.txt
cat > new.txt                   # 从键盘输入创建文件（Ctrl+D 结束）
cat -A file.txt                 # 显示行尾与 Tab（调试隐藏字符）
```

参考链接

- [命令网 head](http://www.w3csky.com/linux/linux-command-head.html)

---

### tail

查看文件结尾内容。

补充说明

`tail` 命令用于查看文件末尾部分（英文 tail，尾巴）。默认输出最后 10 行；配合 `-f` 可实时跟踪文件增长（适合看日志）。

语法

```shell
tail [-befn] [FILE]
tail [-c N] [FILE]
```

选项

```shell
-b  按字节计数
-c <字节数>  只输出最后 N 个字节
-e  等价于 -v
-f  跟踪文件增长（实时追加，Ctrl+C 结束）
-n <行数>  只输出最后 N 行（默认 10）
-v  显示详细处理信息
```

常见用法

```shell
tail file.txt                   # 查看文件最后 10 行
tail -n 20 file.txt             # 查看最后 20 行
tail -c 100 file.txt            # 查看最后 100 字节
tail -f /var/log/syslog         # 实时跟踪日志增长（看日志常用）
tail -n +50 file.txt            # 从第 50 行开始输出到结尾
```

参考链接

- [命令网 tail](http://www.w3csky.com/linux/linux-command-tail.html)

---

### grep / egrep

按正则表达式搜索文件内容。

> `grep` 基本正则；`egrep`（等价 `grep -E`）使用扩展正则，无需转义 `()` `|` `+` 等元字符。

补充说明

`grep` 命令用于在文件中按字符串或正则匹配行并输出。`egrep` 使用扩展正则表达式（ERE），元字符可直接书写。

常用选项

```shell
-i  忽略大小写
-n  输出匹配行的行号
-v  反选：输出不匹配的行
-r  递归搜索子目录
-l  仅列出包含匹配的文件名
-c  只统计匹配行数
-w  按单词整体匹配
-E  使用扩展正则（egrep 等价）
```

常见用法

```shell
grep "error" log.txt              # 查找包含 error 的行
grep -n "error" log.txt           # 带行号
grep -i "error" log.txt           # 忽略大小写
grep -v "^#" config.conf          # 排除注释行（# 开头）
grep -rn "TODO" src/              # 递归搜索 src 下 TODO
grep -l "class" *.java            # 仅列出匹配文件名
grep -c "error" log.txt           # 统计匹配行数
egrep -n "cat|dog" animals.txt    # 扩展正则：匹配 cat 或 dog
egrep -n "[0-9]{3}" numbers.txt   # 匹配三位数字
```

参考链接

- [命令网 grep](http://www.w3csky.com/linux/linux-command-grep.html)
- [命令网 egrep](http://www.w3csky.com/linux/linux-command-egrep.html)

---

### diff

比较两个文件的差异。

补充说明

`diff` 命令以逐行方式比较两个文本文件的异同并输出差异处。若以 `-` 作为参数，则从标准输入读取内容。比较目录时仅比较同名文件，忽略子目录。

常用选项

```shell
-q  仅报告是否存在差异（不显示具体内容）
-u  以 unified 格式显示差异（含上下文，可用于打补丁）
-c  以 context 格式显示差异
-r  递归比较子目录
-i  忽略大小写
-b  忽略空格变化
-w  忽略全部空格
-y  并排显示差异
```

常见用法

```shell
diff a.txt b.txt            # 比较两个文件，输出差异
diff -q a.txt b.txt         # 仅判断是否有差异（返回码 0=相同，1=不同）
diff -u a.txt b.txt         # unified 格式（结果可直接用于 patch 打补丁）
diff -r dir1 dir2           # 递归比较两个目录
```

参考链接

- [命令网 diff](http://www.w3csky.com/linux/linux-command-diff.html)

---

### sort

排序。

补充说明

`sort` 命令用于对多行文本按一定规则排序（英文 sort，排序）。默认按 ASCII 首字母升序；支持按数字、指定列、忽略大小写、去重等。

语法

```shell
sort [选项] 文件
```

选项

```shell
-f  忽略大小写
-i  忽略不可打印字符
-n  按数字大小排序（默认按字符串）
-r  反向排序（降序）
-t  指定分隔符（配合 -k）
-k N[,M]  按第 N 到 M 列排序
-u  去重（保留重复项中第一行）
-b  忽略前导空白
-o FILE  将结果写入指定文件
-M  按月份（Jan..Dec）排序
-h  按人类易读大小排序（1K, 2M...）
```

常见用法

```shell
sort file.txt                   # 按 ASCII 升序排序
sort -n file.txt                # 按数字排序
sort -nr file.txt               # 按数字降序
sort -k2 file.txt               # 按第二列排序
sort -u file.txt                # 排序并去重
sort -t: -k3 /etc/passwd        # 以 : 分隔，按第 3 列排序
sort -o out.txt file.txt        # 排序结果写入 out.txt
sort -h file_sizes.txt          # 按人类易读大小排序（1K/2M）
```

参考链接

- [命令网 sort](http://www.w3csky.com/linux/linux-command-sort.html)

---

### uniq

去重相邻重复行。

> `uniq` 只处理**相邻**的重复行，通常先 `sort` 再 `uniq`。

补充说明

`uniq` 命令用于去除排序后文件中相邻的重复行（英文 unique，唯一）。

语法

```shell
uniq [-ic] 文件
```

选项

```shell
-c  在每行旁输出该行重复次数
-i  忽略大小写
-v  仅输出不重复的行（反向）
```

常见用法

```shell
uniq file.txt                   # 去除相邻重复行
sort file.txt | uniq            # 先排序再去重，得到唯一列表
sort file.txt | uniq -c         # 统计每行出现次数（常用！）
sort file.txt | uniq -d         # 仅列出重复过的行
sort file.txt | uniq -v         # 仅列出唯一（不重复）的行
```

参考链接

- [命令网 uniq](http://www.w3csky.com/linux/linux-command-uniq.html)

---

### wc

统计。

> 统计文件、单词、行、字符等。

补充说明

`wc` 命令用于统计文件中的字节数、字符数、单词数、行数（英文 word count）。语法

```shell
wc [选项] 文件...
```

选项

```shell
-b  统计字节数
-c  统计字符数
-l  统计行数（默认）
-m  统计字符数
-w  统计单词数
-L  输出最长行的长度
```

常见用法

```shell
wc file.txt                   # 输出 行数 单词数 字节数 文件名
wc -l file.txt                # 只统计行数
wc -w file.txt                # 只统计单词数
wc -c file.txt                # 只统计字符数
wc -l *.txt                   # 统计多个文件各自行数
grep -v '^$' file | wc -l     # 统计非空行数量
```

参考链接

- [命令网 wc](http://www.w3csky.com/linux/linux-command-wc.html)

---

## 三、系统信息 <a id="section-system"></a>

### ps

查看进程状态。

补充说明

`ps` 命令用于报告当前进程的状态（英文 process status）。可列出当前正在运行的进程及其相关信息（PID、用户、CPU/内存占用、命令等）。

常用选项

```shell
A  显示所有进程（含其他用户）
a  显示所有进程（含终端，不含无终端）
-r  仅显示正在运行的进程
x  显示无终端控制的进程
u  以用户为主的格式输出（CPU/内存占用等）
e  显示环境变量
j  作业控制格式
l  长格式
-ef  /  -aux  最常用的组合，列出所有进程的详细信息
```

常见用法

```shell
ps aux                        # 列出所有进程详细信息（Linux，BSD 风格）
ps -ef                        # 列出所有进程详细信息（System V 风格）
ps aux | grep nginx           # 筛选特定进程（如 nginx）
ps -u root                    # 列出 root 用户的进程
ps -o pid,user,cmd -p 1234    # 指定列查看特定 PID
ps aux --sort=-%cpu           # 按 CPU 占用排序
ps aux --sort=-%mem           # 按内存占用排序
```

参考链接

- [命令网 ps](http://www.w3csky.com/linux/linux-command-ps.html)

---

### top

实时查看系统资源使用情况。

补充说明

`top` 命令用于实时显示系统中各个进程的资源占用状况（英文 top，顶部）。默认每 3 秒刷新，可动态查看 CPU、内存、进程负载。

常用选项

```shell
-d 秒数  设置刷新间隔（默认 3 秒）
-i      忽略空闲进程
-s      安全模式
-p PID   只监控指定进程
-u 用户名  只监控某用户进程
```

> 运行中按键（交互）：`P` 按 CPU、`M` 按内存、`N` 按 PID、`k` 终止进程、`q` 退出、`c` 显示完整命令。

常见用法

```shell
top                                   # 实时查看系统资源
top -d 2                                # 每 2 秒刷新
top -p 1234                             # 只监控 PID 1234
top -u root                             # 只看 root 用户进程
top -i                                    # 忽略空闲进程
```

参考链接

- [命令网 top](http://www.w3csky.com/linux/linux-command-top.html)

---

### df

查看磁盘空间。

补充说明

`df` 命令用于报告文件系统的整体及个体磁盘使用情况（英文 disk free）。默认输出块数，配合 `-h` 以人类易读方式显示。

常用选项

```shell
-a  显示所有文件系统（含 0 块）
-h  人类易读格式（K/M/G）
-H  以 1000 为单位（而非 1024）
-i  显示 inode 使用情况
-k  以 1024 字节为单位
-l  仅显示本地文件系统
-T  显示文件系统类型
```

常见用法

```shell
df                                        # 列出所有文件系统使用情况
df -h                                     # 人类易读格式（最常用）
df -h /                                   # 仅查看根分区
df -hT                                    # 含文件系统类型
df -h --exclude-type tmpfs                # 排除 tmpfs 等虚拟文件系统
df -i                                     # 查看 inode 使用情况
```

参考链接

- [命令网 df](http://www.w3csky.com/linux/linux-command-df.html)

---

### free

查看内存使用情况。

补充说明

`free` 命令用于查看内存使用情况（英文 free，空闲）。默认以字节显示，配合 `-h` 以人类易读方式显示。

常用选项

```shell
-b  以字节显示
-k  以 KB 显示（默认）
-M  以 MB 显示
-g  以 GB 显示
-h  人类易读格式
-t  显示总计（内存 + 交换分区）
-s  定期刷新（配合秒数）
```

常见用法

```shell
free                                    # 查看内存使用情况
free -h                                   # 人类易读格式（最常用）
free -m                                   # 以 MB 显示
free -t                                   # 含总计（内存+Swap）
free -s 5                                 # 每 5 秒刷新一次
```

参考链接

- [命令网 free](http://www.w3csky.com/linux/linux-command-free.html)

---

### du

查看目录占用空间。

补充说明

`du` 命令用于估算文件目录的使用空间（英文 disk usage）。默认显示当前目录及其子目录的磁盘用量，配合 `-h` 以人类易读方式显示。

常用选项

```shell
-a  显示所有文件（含普通文件）
-h  人类易读格式（K/M/G，最常用）
-s  仅显示总计（不展开子目录）
-x  跳过可移动文件系统
-c  输出总计行
-t  超过指定大小的目录不列出
```

常见用法

```shell
du                                    # 查看当前目录各子目录占用
du -h                                   # 人类易读格式
du -sh /var/log                         # 仅查看某目录总占用（最常用）
du -ah file.txt                         # 含文件本身的占用
du -c dir1 dir2                         # 输出多个目标的总计
du -h --max-depth=1                     # 只展开一层子目录
```

参考链接

- [命令网 du](http://www.w3csky.com/linux/linux-command-du.html)

---

### systemctl

systemd 服务管理工具。

> 用于控制 systemd 系统和“服务”工具。适用于 systemd 管理的发行版（CentOS 7+、Debian 8+ 等）。

补充说明

`systemctl` 命令用于管理 systemd 系统和“服务”（英文 systemctl）。可启动/停止/重启服务、设置开机自启、查看状态等。

> 常用服务：`sshd`、`mariadb`/`mysqld`、`firewalld`、`nginx`、`httpd` 等。

常用选项

```shell
start  启动某服务
stop   停止某服务
restart  重启某服务
status  查看某服务状态
enable  开机自启
disable  取消开机自启
is-active  查看服务是否为 active
is-enabled  查看是否开机自启
list-units  列出所有已加载单元
list-unit-files  列出单元文件及其启用状态
```

常见用法

```shell
systemctl status sshd                     # 查看 sshd 服务状态
systemctl start sshd                        # 启动 sshd 服务
systemctl stop sshd                         # 停止 sshd 服务
systemctl restart sshd                      # 重启 sshd 服务
systemctl enable sshd                       # 设置开机自启
systemctl disable sshd                      # 取消开机自启
systemctl is-active sshd                    # 查看服务是否活动（active/inactive）
systemctl is-enabled sshd                   # 是否开机自启
systemctl list-units --type service         # 列出所有已加载服务单元
systemctl cat mariadb                       # 查看服务单元文件内容
systemctl --failed                          # 列出启动失败的服务
```

参考链接

- [命令网 systemctl](http://www.w3csky.com/linux/linux-command-systemctl.html)

---

## 四、网络 <a id="section-network"></a>

### ssh

登录并管理远程服务器。

补充说明

`ssh` 命令用于安全地远程登录并管理远程服务器（英文 secure shell）。默认端口 22；支持公钥免密登录。常用选项

```shell
-p PORT  指定端口（默认 22）
-l USER  指定登录用户名
-N  不执行命令，仅建立隧道
-T  禁用交互 shell
-g  允许远程主机连接本地转发端口
-L localport:remotehost:remoteport  本地端口转发
-R remoteport:localhost:localport  远程端口转发
-C  压缩传输
-v  显示调试信息
```

常见用法

```shell
ssh -p 22 user@192.168.1.100              # 以 user 登录服务器
ssh -p 10022 root@192.168.1.100           # 指定端口登录
ssh -l admin 192.168.1.100                # 指定用户名
ssh -N -L 8080:localhost:80 server        # 本地 8080 转发到服务器 80 端口
ssh -R 3307 localhost:3306 server         # 远程端口转发（MySQL）
ssh -v user@host                          # 调试模式查看连接过程
```

> 免密登录：先用 `ssh-keygen` 生成密钥，再用 `ssh-copy-id` 将公钥上传到服务器。

参考链接

- [命令网 ssh](http://www.w3csky.com/linux/linux-command-ssh.html)

> 相关：`scp`（基于 SSH 的安全文件传输，用法见下方传输命令）。

---

### curl

利用 URL 命令行传输文件。

补充说明

`curl` 是一个利用 URL 规则在命令行下工作的文件传输工具。支持 HTTP/HTTPS/FTP 等协议，支持上传下载、POST、Cookie、认证、部分下载、限速、进度条等。

常用选项（常用部分）

```shell
-o  输出到指定文件（自定文件名）
-O  保留远程文件名输出到文件
-s  静默模式（不输出进度/错误）
-L  跟随重定向（-L/-follow）
-X METHOD  指定请求方法（GET/POST/PUT/DELETE）
-d DATA  发送 POST 数据（表单）
--data-urlencode  自动 URL 编码 POST 数据
-H "Header: value"  自定义请求头
-b 'cookie'  /  --cookie  发送 Cookie
-j  忽略会话 Cookie
-A "User-Agent"  设置用户代理
--referer URL  设置来源页
--limit-rate 50k  限速下载
--max-filesize N  限制最大下载量
-C -  断点续传
-u user:pwd  身份认证
-I / --head  只输出响应头
-w  输出传输细节（如耗时）
```

常见用法

```shell
curl URL                        # 下载文件输出到终端
curl URL --silent               # 静默下载（无进度/错误）
curl http://example.com/test.iso --silent -O  # 下载到本地（保留原名）
curl http://example.com/test.iso -o filename.iso --progress  # 指定文件名 + 进度条
curl -C - URL                   # 断点续传
curl --referer http://www.example.com http://example.com  # 设置来源页
curl URL --user-agent "Mozilla/5.0"   # 设置用户代理
curl URL --limit-rate 50k       # 限速 50k 下载
curl -u user:pwd http://example.com  # 认证
curl -I http://example.com      # 只查看响应头（HTTP 状态等）
curl "http://www.example.com"   # GET 请求
curl -d "param1=value1&param2=value2" "http://example.com/login"   # POST 表单
curl -d 'login=emma' -d 'password=123' -X POST https://example.com/login  # POST 多字段
curl --data-urlencode 'comment=hello world' https://example.com/login  # 自动 URL 编码
curl -d '@data.txt' https://example.com/upload  # 发送本地文件内容作为数据体
curl -l -H "Content-type: application/json" -X POST -d '{"phone":"138..."}' http://example.com/apis  # JSON POST
curl http://example.com --cookie "user=root;pass=123456"   # 发送 Cookie
curl -b 'foo=bar' https://example.com           # 通过 -b 发送 Cookie
curl URL --cookie-jar cookie_file               # 将 Cookie 存到文件
curl -s -o /dev/null https://example.com        # 不产生任何输出（探测用）
curl -o- -L https://yarnpkg.com/install.sh | bash   # 下载并管道执行（配合 -L 跟踪重定向）
curl -w ... -o /dev/null URL  # 输出耗时等传输细节（-w 详细输出）
```

参考链接

- [命令网 curl](http://www.w3csky.com/linux/linux-command-curl.html)

---

### wget

下载文件工具。

补充说明

`wget` 用来从指定 URL 下载文件。带宽很窄或不稳定网络中适应性强；失败会不断重试直至下载完毕；服务器打断后会从停止处继续下载。支持 HTTP/HTTPS/FTP 及代理，可在后台执行。

常用选项（常用部分）

```shell
-O  以指定文件名保存（指定动态链接文件名）
-o  将下载信息写入日志文件
-a  追加日志到文件
-c  断点续传
-b  转为后台下载
-i file  读取文件中的 URL 批量下载
-r  递归下载（慎用）
-m  镜像整站（= -r -N -l inf -nr）
-p  下载页面所需资源（图片等）
-k  转换链接为本地链接
-L  跟踪相对链接
-N  仅当远程文件更新才下载
-t N  重试 N 次（0=无限）
-T 秒  响应超时秒数
--limit-rate 速率  限速
-Q 大小  限制递归总下载量
--spider  不下载，只测试链接是否有效
--user-agent  伪装代理名
-Y on/off  打开/关闭代理
```

常见用法

```shell
wget http://www.example.com/testfile.zip        # 下载单个文件
wget -O wordpress.zip http://example.com/d?id=1080  # 以指定文件名保存（动态链接常用）
wget --limit-rate=300k http://example.com/file  # 限速下载
wget -c http://example.com/testfile.zip         # 断点续传
wget -b http://example.com/testfile.zip         # 后台下载（可用 tail -f wget-log 看进度）
wget --spider URL                               # 测试链接是否有效（定时下载前检查）
wget --tries=40 URL                             # 增加重试次数
wget -i filelist.txt                            # 批量下载（文件里每行一个 URL）
wget --mirror -p --convert-links -P ./LOCAL URL  # 镜像整站到本地
wget --reject=gif URL                           # 下载网站但排除图片
wget -o download.log URL                        # 将下载信息存入日志文件
```

> 说明：默认以最后一个 `/` 后的字符命名，动态链接常导致文件名错误，此时用 `-O` 指定。

参考链接

- [命令网 wget](http://www.w3csky.com/linux/linux-command-wget.html)

---

### ping

测试主机间网络连通性（IPv4）。

补充说明

`ping` 用来测试主机之间网络的连通性。使用 ICMP 协议发出回应请求，远端网络正常则回应，从而判断其运作正常。

常用选项

```shell
-c 次数  指定回应次数后退出
-i 间隔  指定收发间隔（秒）
-n  只输出数值（不显示过程）
-r  忽略普通路由表，直接送到远端主机
-R  记录路由过程
-s 大小  设置数据包大小
-t  设置存活数值 TTL
-w 秒  超过该秒数即退出
-f  极限检测（快速发送）
-q  不显示执行过程（仅开头结尾）
```

常见用法

```shell
ping www.example.com                    # 测试到主机是否连通
ping -c 4 www.example.com               # 只发 4 个包后退出
ping -i 0.2 host                        # 每 0.2 秒发一个包
ping -n 192.168.1.1                     # 只输出数值结果
```

> 输出示例含：往返时间（time=ms）、丢包率（packet loss）、最小/平均/最大/偏差（rtt min/avg/max/mdev）。

参考链接

- [命令网 ping](http://www.w3csky.com/linux/linux-command-ping.html)

---

### netstat

查看网络系统状态信息。

补充说明

`netstat` 命令用于打印 Linux 网络系统的状态信息，可了解整个系统的网络情况。可列出端口、连接状态、路由表、统计信息等。

常用选项

```shell
-a / --all          列出所有连接（含监听与未监听）
-t / --tcp          仅 TCP 连接
-u / --udp          仅 UDP 连接
-l / --listening    仅监听中的 Socket
-n / --numeric      直接用 IP/端口，不解析域名（加速）
-r / --route        显示路由表
-s / --statistics   显示各协议统计信息
-p / --programs     显示进程 PID 与名称（需 root）
-e / --extend       显示更详细信息
-A <网络类型>       列出该网络类型的连接（如 unix）
-c / --continuous   持续列出（每秒刷新）
```

常见用法

```shell
netstat -a                        # 列出所有端口（含监听与未监听）
netstat -at                       # 仅 TCP 端口
netstat -au                       # 仅 UDP 端口
netstat -l                        # 仅监听端口
netstat -lt                       # 仅监听 TCP 端口
netstat -an                       # 数字格式（不解析域名，且更快）
netstat -rn                       # 数字格式路由表
netstat -tlnp                     # 监听中的 TCP 端口 + 进程 PID
netstat -ap | grep ssh            # 找出 ssh 相关端口（需 root）
netstat -anp | grep 8081          # 通过端口找进程 ID
netstat -s                        # 各协议统计信息
netstat -c                        # 每秒刷新输出（Ctrl+C 结束）
netstat -ntu | grep :80 | awk '{print $5}' | cut -d: -f1 | sort | uniq -c  # 统计某端口连接数最多的 IP
```

> 相关：`ss` 是更快速的替代工具（见下方）。

参考链接

- [命令网 netstat](http://www.w3csky.com/linux/linux-command-netstat.html)

---

### ss

比 netstat 更高效的 socket 统计工具。

补充说明

`ss` 命令用于显示处于活动状态的套接字信息，是 `iproute2` 包附带的工具，可获取与 netstat 类似的内容，且更快——尤其当连接数上万时，ss 远快于 netstat（后者等于“浪费生命”）。常用选项

```shell
-a / --all       显示所有套接字
-l / --listening 仅监听状态
-t / --tcp       仅 TCP
-u / --udp       仅 UDP
-n / --numeric   不解析服务名（快）
-e / --extended  详细信息
-o / --options   计时器信息
-p / --processes 显示使用套接字的进程
-i / --info      TCP 内部信息
-s / --summary   套接字使用概况
-4 / --ipv4      仅 IPv4
-6 / --ipv6      仅 IPv6
```

> 过滤语法（`ss` 独有，很强大）：`ss state <状态>`、`ss sport = :port`、`ss dport OP PORT`（OP 可为 `= < > >= <= !=`）、`ss dst/src <地址>`。

常见用法

```shell
ss -tan                                   # 列出所有 TCP 连接（最常用）
ss -tlnp                                  # 监听中的 TCP 端口 + 进程
ss -s                                     # 套接字摘要
ss -pl                                    # 查看进程使用的 socket
ss -lp | grep 3306                        # 找出打开某端口（3306）的应用
ss state all sport = :ssh                 # 列出端口为 ssh 的所有连接
ss -tan | awk 'NR>1{++S[$1]}END{for(a in S) print a,S[a]}'  # 统计各 TCP 状态连接数
ss dst 192.168.1.5                        # 匹配远程地址
ss src 192.168.1.103:ssh                  # 匹配本地地址
ss dport = :80                            # 匹配目标端口 80
ss sport > :1024                          # 本地端口大于 1024
ss -4 state closing                       # 按 TCP 状态过滤（closing）
```

> 效率对比：`time netstat -at` 与 `time ss` 可直观看出 ss 更快。

参考链接

- [命令网 ss](http://www.w3csky.com/linux/linux-command-ss.html)

---

### nmcli

NetworkManager 命令行客户端（配置网络）。

补充说明

`nmcli`（NetworkManager client）是 NetworkManager 的网络管理客户端，用于命令行下查看、管理与配置网络（连接、设备、无线、DNS 等），替代图形界面的网络设置。常用选项

```shell
-t / -- terse       简洁输出（适合脚本解析）
-p / -- pretty      格式化输出
-m / -- mode        输出模式：tabular | multiline
-f / -- fields      指定输出字段（字段1,字段2,... | all | common）
-n / -- nocheck     不检查 nmcli 与 NetworkManager 版本
-v / -- version     显示程序版本
-h / -- help        查看帮助
```

**对象（OBJECT）：** `general` 一般状态、`networking` 整体组网、`radio` 无线开关、`connection` 连接、`device` 受管设备、`agent` 秘密代理。

常见用法

```shell
nmcli connection show                       # 查看当前连接
nmcli connection show -active                 # 显示活动的连接
nmcli connection show "lan eth0"              # 查看指定网络连接配置
nmcli connection reload                       # 重载/重启连接
nmcli device status                           # 显示设备状态（网卡）
nmcli device show eno16777736                 # 显示指定接口的属性
nmcli device show                             # 显示全部接口属性
nmcli con up static                           # 启用名为 static 的连接
nmcli con up default                          # 启用默认连接
nmcli connection add con-name company ifname ens33 autoconnect no type ethernet ip4 192.168.1.2/24 gw4 192.168.1.1  # 新建连接配置
```

**新建连接参数：** `con-name` 会话名、`ifname` 网卡名、`autoconnect` 是否自动连接、`type` 网卡类型（ethernet）、`ip4/ip6` 地址、`gw4/gw6` 网关。

参考链接

- [命令网 nmcli](http://www.w3csky.com/linux/linux-command-nmcli.html)

---

## 五、压缩与归档 <a id="section-compression"></a>

### tar

打包与解压（归档）工具。

补充说明

`tar` 命令可为 Linux 文件和目录创建档案（打包），也能从档案中单独还原所需文件。需弄清两个概念：**打包** 是把一堆文件变成一个文件；**压缩** 是用压缩算法把大文件变小。tar 只负责打包，压缩需配合 gzip/bzip2/xz（通过 `-z/-j/-J`）。

> 常用压缩参数：`-z` gzip（`.tar.gz`/`.tgz`）、`-j` bzip2（`.tar.bz2`）、`-J` xz（`.tar.xz`）、`-Z` compress（`.tar.Z`，过时）。

常用选项（常用部分）

```shell
-c / --create     创建新归档
-x / --extract    从归档解出文件
-t / --list       列出归档内容
-u / --update     仅追加比归档中更新的文件
-f 文件名         指定归档文件名（必须是最后一个参数！）
-z / --gzip       通过 gzip 压缩/解压
-j / --bzip2      通过 bzip2
-J / --xz         通过 xz
-v / --verbose    详细列出处理过程
-p / --preserve-permissions  保留权限（备份常用）
-C 目录           切换到指定目录再操作
--strip-components N  解压时去除文件名前 N 层路径
```

常见用法

```shell
tar -zcvf log.tar.gz log2012.log      # 打包并以 gzip 压缩（最常用）
tar -jcvf log.tar.bz2 log2012.log     # 打包并以 bzip2 压缩
tar -Jcvf log.tar.xz log2012.log      # 打包并以 xz 压缩
tar -cf archive.tar foo bar           # 仅打包，不压缩（.tar）
tar -tvf archive.tar                  # 查看 tar 包内文件
tar -zxvf log.tar.gz                  # 解压 .tar.gz（最常用）
tar -xvf xxx.tar.gz -C /usr/src/a     # 解压到指定目录
tar -xvf xxx.tar.gz --strip-components 1 -C /usr/src/a  # 解压并去掉一层路径
tar -ztvf log.tar.gz                  # 查看 .tar.gz 内文件（带 z）
tar -zcvpf log31.tar.gz log1 log2     # 打包并保留权限
tar -N "2012/11/13" -zcvf log17.tar.gz test  # 只备份某日期之后的文件
tar --exclude scf/service -zcvf scf.tar.gz scf/*  # 打包时排除部分文件
tar -cvf test.tar test --remove-files # 打包后删除源文件
```

> 速记：压缩 `tar -jcv -f 包名 目标`；查询 `tar -jtv -f 包名`；解压 `tar -jxv -f 包名 -C 目录`。

参考链接

- [命令网 tar](http://www.w3csky.com/linux/linux-command-tar.html)

---

## 六、权限管理 <a id="section-permission"></a>

### chmod

修改文件权限。

补充说明

`chmod` 命令用于文件或目录的访问权限修改（英文 change mode）。可通过数字（4 读 2 写 1 执行）或符号（rwx）设置所有者、所属组、其他人的权限。常用选项

```shell
-R / --recursive  递归修改目录及其内容的权限
```

> 权限数字：读=4、写=2、执行=1。三位数字分别对应 所有者 / 所属组 / 其他人（如 755、644）。

常见用法

```shell
chmod 755 script.sh       # 所有者可读写执行，组与其他人可读执行
chmod 644 file.txt        # 所有者读写，组与其他人只读
chmod +x script.sh        # 给所有人添加可执行权限
chmod -x script.sh        # 移除所有人可执行权限
chmod u+x,g-w,o+r file    # 符号式：所有者加执行、组去掉写、其他人加读
chmod -R 755 /var/www     # 递归修改目录权限（Web 目录常用）
chmod 700 dir/            # 仅所有者可读写执行
```

参考链接

- [命令网 chmod](http://www.w3csky.com/linux/linux-command-chmod.html)

---

## 七、进程管理 <a id="section-process"></a>

### kill

结束进程。

补充说明

`kill` 命令用于结束进程（英文 kill，杀死）。通过进程 ID（PID）发送信号，默认发送 `TERM`（15）信号。常用 `1`（SIGHUP）强制结束。常用选项

```shell
-s 信号名/编号  指定发送的信号（如 -9、-15、-HUP）
-l  列出所有可用信号名
-p  仅打印目标 PID，不实际发送（dry-run）
```

> 常见信号：`1` SIGHUP（强制结束）、`9` SIGKILL（强制杀死，不可忽略）、`15` SIGTERM（默认，优雅结束）、`19` SIGSTOP（暂停）、`18` SIGCONT（继续）。

常见用法

```shell
kill 1234                       # 向 PID 1234 发送 TERM 信号（默认）
kill -9 1234                    # 强制杀死 PID 1234（SIGKILL）
kill -1 1234                    # 发送 SIGHUP（常用于重载配置）
kill -l                         # 列出所有信号名及编号
kill -s KILL 1234               # 等价于 kill -9
kill -l | grep SIG              # 筛选信号列表
PID=$(pgrep -f myprocess); kill -9 "$PID"   # 按名称找 PID 并结束
```

> 提示：先用 `ps` / `pgrep` 找到 PID，再 `kill`；优先用 15 优雅结束，无效再用 9 强制。

参考链接

- [命令网 kill](http://www.w3csky.com/linux/linux-command-kill.html)

---

## 八、版本控制 <a id="section-version-control"></a>

### git

目前世界上最先进的分布式版本控制系统。

补充说明

`git` 命令是分布式版本控制工具，用于版本管理与代码协作。常用操作见下方（已精简冗长的历史叙述）。

常用命令

```shell
git --version                   # 查看版本
git init                        # 初始化仓库
git clone <url> [目录名]        # 克隆远程仓库（支持 http/ssh/git/本地等协议）
git add <文件|.|*>              # 将文件添加到暂存区（. 或 * 代表全部）
git rm --cached <文件>          # 撤销 git add（commit 前）
git reset HEAD [文件]           # 从暂存区移出（也可撤销 add）
git commit -m "message"         # 提交并写注释
git status                      # 查看工作区状态
git log                         # 查看提交历史
git branch                      # 列出分支
git branch <name>               # 创建分支
git branch -d <name>            # 删除分支
git checkout <branch>           # 切换分支
git checkout -b <name>          # 创建并切换分支
git merge <branch>              # 合并分支
git pull                        # 拉取并合并远程更新
git push -u origin master       # 推送并设置默认跟踪分支
git push -f origin master       # 强制推送（--force）
git remote add origin <url>     # 添加远程仓库
git remote -v                   # 查看远程仓库
git tag <name>                  # 打标签
git stash                       # 保存当前修改到栈
git stash pop                   # 恢复 stash
```

配置与 SSH

```shell
git config --global user.name "你的名字"      # 修改全局用户名
git config --global user.email "邮箱"         # 修改全局邮箱
git config --list                             # 查看配置
git config --global core.autocrlf input       # 配置自动换行（提交转 LF）

ssh-keygen -t rsa -C "你的邮箱"               # 生成 SSH 密钥
ssh -T git@github.com                         # 测试密钥是否生效
ssh-copy-id -i ~/.ssh/公钥.pub user@host      # 将公钥上传到服务器（免密登录）
```

> 多账号 / 免密：可为不同仓库配置不同密钥，并在 `~/.ssh/config` 中用 `Host` 别名区分（详见原 git 文档）。

参考链接

- [Git 常用命令清单](https://github.com/jaywcjlove/handbook/blob/master/other/Git%E5%B8%B8%E7%94%A8%E5%91%BD%E4%BB%A4%E6%B8%85%E5%8D%95.md)

---

## 九、帮助与权限提升 <a id="section-help"></a>

### sudo

以其他用户身份执行命令。

补充说明

`sudo` 命令允许基本用户以系统管理员（root）或其他用户身份运行命令（英文 super user do）。可临时提升权限执行特权操作，并记录审计日志。常用选项

```shell
-u 用户 / -u UID   指定以哪个用户身份执行（默认 root）
-h / --help        显示帮助并退出
-V / --version     显示版本并退出
-l / --list        列出当前用户可执行的命令
-k / --invalidate  使身份凭证失效（下次需重新验证）
```

常见用法

```shell
sudo command            # 以 root 身份执行 command
sudo -u otheruser cmd   # 以 otheruser 身份执行
sudo -l                 # 列出当前用户可执行的命令
sudo apt install pkg    # 以 root 安装软件包
sudo systemctl restart nginx  # 以 root 管理服务
```

> 提示：首次使用 sudo 需输入**当前用户**密码；配置不当可能带来安全风险，建议按需授权。

相关命令

- `chmod`、`chown`、`ls`、`cat`、`ls -l` 等可配合 sudo 以 root 身份查看/修改系统文件。

---

### man

查看命令帮助手册。

补充说明

`man` 命令是通过 man 手册查看 Linux 指令、配置文件与编程帮助的工具。语法

```shell
man (选项)(参数)
```

选项

```shell
-a / --all       在所有 man 手册中搜索
-f / --whatis    显示关键字的简短描述（等价 whatis）
-P 程序          指定分页程序
-M 路径          指定 man 手册搜索路径
```

参数

```shell
数字  指定从哪本手册搜索；关键字  指定要搜索的关键字
```

**手册章节号对照：**

```shell
1  用户可在 shell 操作的命令或执行文件
2  系统内核可调用的函数与工具
3  常用函数与函数库（多为 C 库 libc）
4  设备文件说明（/dev 下）
5  配置文件或某些文件格式
6  游戏（games）
7  惯例与协议（文件系统、网络协议、ASCII 等）
8  系统管理员可用的管理命令
9  与 kernel 有关的文件
```

常见用法

```shell
man ls                              # 查看 ls 手册（左上角显示 LS(1)）
man ifconfig                        # 查看 ifconfig（显示 IFCONFIG(8)）
man 3 sleep                         # 指定章节（查库函数 sleep 用第 3 章）
man -s 8 route                      # 指定章节查看 route
```

> 相关：`tldr` 是简化版手册，只列出常用 Sample 与说明，比 man 更轻量。

- tldr 开源：[https://github.com/tldr-pages/tldr/](https://github.com/tldr-pages/tldr/)
- 官网：[https://tldr.sh/](https://tldr.sh/)
- 在线版：[https://tldr.ostera.io/](https://tldr.ostera.io/)

---

*本文档由各独立命令文档合成，保留了各命令的原始结构与参考链接，并对冗长内容做了精简，便于快速查阅。*
