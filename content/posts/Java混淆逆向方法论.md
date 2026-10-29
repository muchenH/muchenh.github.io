---
title: 拆解 Allatori 混淆的 Java 桌面程序：不重实现，让程序自己解密字符串
date: 2026-10-29 21:50:00
category: 
- 逆向工程
- Java
tags: 
- 逆向
- Java
- 混淆
- pack200
- Allatori
index_img: /img/default.png
banner_img:

---
### 从一个只发二进制的 Java 客户端说起

手上有这么一个东西：Windows 上的一款商业桌面客户端，只发布编译后的 exe，没有任何源码。拆开一看是 Java 写的——外面套 NSIS 安装包，里面塞了个精简版 JRE 17，主体是个被 pack200 压过的 jar，解开有 **17,373 个 class**。

再打开反编译结果，满屏长这样：

```java
if (c.d(517287540690064504L).invoke(null, new Object[]{ c.a(20881143L, ...) }) != null) …
```

类名是一到两个字母，方法名是一个字母，字符串全是 `static String a(int, int)` 现算的。你要读懂任何一行逻辑，先得把这张字符串表还原出来——否则连"这个按钮点了干什么"都判断不了。

本文记录的是**怎么在几十分钟内把这张表全捞出来**，以及过程中踩到的两个坑。核心思路一句话：**不要重实现它的解密算法，直接让程序自己算给你。**

这不是什么高深技巧，但很多人第一反应是去静态硬啃 `tableswitch`，然后在 `charArray[0] & 255` 的奇偶分支里迷路一周。

### 一、工具链

| 用途 | 工具 | 备注 |
|---|---|---|
| 拆 NSIS / 看结构 | 7-Zip | 能直接展开 `Nullsoft` 安装包 |
| 还原 pack200 | 安装包自带的 `unpack200.exe` | JDK 17 里已经没有了 |
| 反编译 | jadx（批量）+ CFR（细读） | jadx 快但偶有语法错，CFR 更准 |
| 反射执行 | 一个 20 行的自定义类 | 见第五节 |
| 运行时探针 | `-javaagent` + `java.lang.instrument` | 见第六节 |

前置知识只需要两样：Java 类加载机制（`Class.forName(name, initialize, loader)` 那个 `initialize` 参数到底干什么）、以及 `java.lang.reflect` 的基本用法。不需要会写 JVM 字节码。

### 二、第一层：认出 NSIS 安装包

先从字节层面确认外层是什么，别猜扩展名。

```powershell
# 读前 128 KiB，找 NSIS 的特征串
$fs = [IO.File]::OpenRead("setup.exe")
$buf = New-Object byte[] (128KB)
$null = $fs.Read($buf, 0, $buf.Length)
$fs.Dispose()

$text = [Text.Encoding]::ASCII.GetString($buf)
if ($text.Contains("Nullsoft")) { "NSIS 安装包（32 位 stub）" }
```

确认是 NSIS 之后直接 `7z x` 展开：

```powershell
7z x setup.exe -oextracted
```

展开后目录结构一眼就能看出技术栈：

```text
extracted/
  jre/                    # 精简 JRE 17.0.7，几十 MB
  app.exe                 # 启动器 stub
  app_win.pack.gz         # ← 真正的主体，25.9 MB
  lib-run/bcprov.jar      # BouncyCastle
  ipdata.dat
  winpcap_install.exe
```

看到 `*.pack.gz` 和 `lib-run/`，基本可以确定：Java 应用，主 jar 被 pack200 压过，附带 BouncyCastle（后面会用到）。

### 三、第二层：pack200 还原

`pack200` 是 JDK 早年为了压缩 jar 分发做的格式，`.pack.gz` 外面是 gzip，解开后开头是魔数 `CAFED00D`。确认一下：

```powershell
$fs = [IO.File]::OpenRead("extracted\app_win.pack.gz")
$head = New-Object byte[] 8
$null = $fs.Read($head, 0, 8)
$fs.Dispose()
($head | ForEach-Object { $_.ToString("X2") }) -join " "
# 1F 8B ...  → gzip
```

关键点：**JDK 17 里已经找不到 `unpack200` 了**。这个工具从 JDK 14 起被标记为待删除，到 JDK 17 正式移除。所以要么装个 JDK 8，要么——更省事——直接用安装包自带的那个：

```powershell
extracted\unpack200.exe extracted\app_win.pack.gz app.jar
```

```powershell
# 验证
Get-Item app.jar | Select-Object Length
#   Length
#   ------
#   49174505

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead("$PWD\app.jar")
($zip.Entries | Where-Object { $_.FullName -like "*.class" }).Count
$zip.Dispose()
# 17373
```

17,373 个 class，49 MB。到这里第一层工程门槛就过了。看一眼 `META-INF/MANIFEST.MF`：

```text
Main-Class: st
Class-Path: lib-run/bcprov.jar
```

`Main-Class` 是个两字母类，典型的混淆入口。反编译 `st.main` 会发现它只是个 trampoline——里面没有业务逻辑，全是通过反射往别的类跳。这是有意为之：让静态分析的起点就断掉。

### 四、第三层：认出 Allatori 系混淆

混淆器有很多家（ProGuard、Zelix KlassMaster、Allatori、DashO……），特征各不相同。Allatori 系的指纹很好认，三条同时出现基本可以定案：

**指纹 1：类名与包名塌缩**

```powershell
# 统计默认包（无包名）下的 class 数量
$zip = [IO.Compression.ZipFile]::OpenRead("$PWD\app.jar")
$root = $zip.Entries | Where-Object { $_.FullName -notmatch "/" -and $_.FullName -like "*.class" }
$root.Count
$zip.Dispose()
# 776
```

776 个类直接躺在默认包里，类名从 `A.class` 到 `zz.class`——就是 `A`、`B`……`Z`、`aa`、`ab`……这么排下来的。业务类本该有包结构（`com.xxx.yyy`），塌缩到默认包说明包名被抹了。

**指纹 2：每个类自带一个字符串解密器**

用 `javap` 看任意一个类的方法列表：

```powershell
javap -p -classpath app.jar A
```

```text
Compiled from "A.java"
class A {
  static java.lang.String[] a;
  static java.lang.String a(int, int);
  ...
}
```

`private static String a(int, int)` + 同名的 `static String[]` 缓存字段，这是 Allatori 的标志性产物。方法体形态固定：

- 参数 `(int, int)` 是**密文数组里的两个下标/偏移**，编译期就固化在调用点；
- 方法内部一串 `tableswitch(charArray[0] & 255)` 分派，每支做 XOR / 循环左移（ROL）反馈；
- 算完的结果写进同名 `String[]` 缓存，第二次调用直接查表。

**指纹 3：全局字符串仓库 + 反射门面**

还有一个专门的类（这里叫 `com.c`）持有三个大数组：`Object[]`、`String[]`、`String[]`。所有被混淆的字段访问、方法调用都被改写成这个门面的调用，参数是编码过的 `long` id：

```java
c.c(long) → java.lang.reflect.Field
c.d(long) → java.lang.reflect.Method
c.a(...)  → Object[]
```

所以你会看到 `c.d(517287540690064504L).invoke(...)` 这种满屏的写法。**这不是加密，是把静态可读性彻底打碎**——字段名、方法名、参数全部换成了数字 id，运行时才映射回去。

到这里可以下结论了：静态硬啃的成本极高。你没有名字、没有字符串、没有结构，只有一个巨大的数字调度表。

### 五、破局点一：让程序自己解密字符串

关键观察：**混淆保护的是"可读性"，不是"可执行性"**。

那个 `static String a(int, int)` 就在 jar 里，是一个普通的静态方法。它需要的输入（两个 int）在反编译结果里全都明明白白地写着——`a(-8791, -20661)` 就是。它需要的运行时依赖（静态 char[] / int[] 常量表）在类的 `<clinit>` 里由一段确定性的代码填好。

也就是说：**这个 jar 本身就是一个完整的、可调用的解密服务。** 我只要把它加载进来，按反编译里抄下来的参数挨个调一遍就行。

#### 5.1 一个最小可用的反射调用器

```java
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;

public final class StringTableDumper {

    private final URLClassLoader loader;

    public StringTableDumper(Path jar) throws Exception {
        // 父加载器用系统加载器，这样 BouncyCastle 之类依赖能正常解析
        this.loader = new URLClassLoader(
                new URL[]{ jar.toUri().toURL() },
                StringTableDumper.class.getClassLoader());
    }

    /**
     * 在 className 里找到「返回 String、静态、两个 int 参数」的方法并调用。
     * initialize = true 会先跑完 <clinit>，这是必须的：
     * Allatori 的常量表在那里赋值，不初始化就会拿到 null。
     */
    public String decrypt(String className, int a, int b) {
        Class<?> c;
        try {
            c = Class.forName(className, true, loader);
        } catch (Throwable t) {
            // 有些类的静态块会做环境校验/自杀，这类跳过，不要让它拖垮整轮
            return null;
        }

        Method target = null;
        for (Method m : c.getDeclaredMethods()) {
            Class<?>[] p = m.getParameterTypes();
            if (m.getReturnType() == String.class
                    && Modifier.isStatic(m.getModifiers())
                    && p.length == 2
                    && p[0] == int.class
                    && p[1] == int.class) {
                target = m;
                break;
            }
        }
        if (target == null) {
            return null;
        }

        target.setAccessible(true);
        try {
            // 静态方法，实例参数传 null
            return (String) target.invoke(null, a, b);
        } catch (Throwable t) {
            return null;
        }
    }
}
```

就这么多。四十来行，没有一行在实现解密算法。

#### 5.2 从反编译结果里批量提取调用点

反过来想：我不需要知道该调什么参数，**反编译结果里已经写着所有被调用过的参数组合**。用正则全量扫一遍即可。

```python
import re
import pathlib

# 解密器调用长这样：  A.a(-1234, 5678)   /   zz.b(42, -7)
# 外层类名 1-3 字符，方法名 1 字符，两个可带负号的整数
CALL = re.compile(r'\b([A-Za-z][A-Za-z0-9_]{0,2})\.([a-z])\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)')

calls = set()
for f in pathlib.Path("decompiled").rglob("*.java"):
    text = f.read_text(encoding="utf-8", errors="replace")
    for m in CALL.finditer(text):
        calls.add((m.group(1), int(m.group(3)), int(m.group(4))))

print(f"distinct call sites: {len(calls)}")
# distinct call sites: 15569
```

去重后 **15,569 个不同的参数组合**。这就是那张字符串表的完整索引。

> 注意：真正的"这个字符串属于哪个调用点"的映射要保留下来（同一个 `(i,j)` 在不同类里可能是不同字符串，因为解密器是按类分的、常量表也按类分）。上面的 `set` 只用来估规模，实际落地时要按 `(类名, i, j)` 三元组遍历。

#### 5.3 跑起来

```java
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;

public final class Dump {
    record Site(String cls, int i, int j) {}

    public static void main(String[] args) throws Exception {
        StringTableDumper d = new StringTableDumper(Path.of("app.jar"));
        List<Site> sites = loadSites();          // 来自上一步生成的三元组清单

        int ok = 0, fail = 0;
        // 显式 UTF-8：Windows 控制台默认 GBK，会把中文吞成 '?'
        try (PrintWriter out = new PrintWriter("strings.tsv", StandardCharsets.UTF_8)) {
            for (Site s : sites) {
                String v = d.decrypt(s.cls(), s.i(), s.j());
                if (v != null) {
                    out.printf("%s\t%d\t%d\t%s%n",
                            s.cls(), s.i(), s.j(),
                            v.replace("\n", "\\n").replace("\t", "\\t"));
                    ok++;
                } else {
                    fail++;
                }
            }
        }
        System.out.printf("recovered=%d failed=%d%n", ok, fail);
    }
}
```

注意几个踩过的坑：

1. **`Class.forName(name, true, loader)` 的 `true` 不能省。** 省略就只加载不初始化，`<clinit>` 不跑，常量表全是 null，所有调用返回 `null` 或抛 NPE。我第一次跑出来 `recovered=0` 就是这个原因。
2. **必须自带 UTF-8 输出。** 不加 `StandardCharsets.UTF_8`，在 Windows 上中文全变 `?`，而且已经写进文件了，事后再转码救不回来。
3. **单个类失败要吞掉。** 有些类在静态块里检测调试环境、或者依赖缺失的原生库，`Class.forName` 会抛 `ExceptionInInitializerError` / `UnsatisfiedLinkError`。让它跳过，不要中断整轮。
4. **反编译产物有语法错误是常态。** jadx 对混淆代码偶有输出不合法 Java 的情况，正则是在文本层面扫的，不受影响——但如果改用 AST 解析就会崩。

跑完拿到一万五千多条明文，整个程序立刻从"数字调度表"变成可读代码：`c.d(517287540690064504L)` 现在知道对应哪个方法名，`c.a(...)` 知道拼的是哪条消息。

### 六、破局点二：`-javaagent` 进程内探针

字符串表解决了"看得懂"，但还有一类问题它解决不了：**运行时的真实状态**。比如程序算出来的某个值，只在启动后某个时刻才存在，静态分析拿不到。

思路同上——不重算，直接问程序。用 `java.lang.instrument` 在 `main` 之前挂进去，延迟一点，然后反射读它的静态字段、调它的方法。

```java
import java.lang.instrument.Instrumentation;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

public class Probe {
    public static void premain(String args, Instrumentation inst) {
        Thread t = new Thread(() -> {
            // premain 在 main 之前执行，此时目标类的运行时状态还没就绪
            try { Thread.sleep(1500); } catch (InterruptedException ignored) {}

            String target = System.getProperty("probe.class", "com.example.Target");
            try {
                Class<?> c = Class.forName(target);

                for (Method m : c.getDeclaredMethods()) {
                    if (m.getParameterCount() == 0 && m.getReturnType() == String.class) {
                        m.setAccessible(true);
                        System.out.println("[probe] " + m.getName() + "() = " + m.invoke(null));
                    }
                }
                for (Field f : c.getDeclaredFields()) {
                    if (f.getType() == String.class) {
                        f.setAccessible(true);
                        System.out.println("[probe] field " + f.getName() + " = " + f.get(null));
                    }
                }
            } catch (Throwable e) {
                e.printStackTrace();
            }
        }, "probe");
        t.setDaemon(true);
        t.start();
    }
}
```

`MANIFEST.MF`：

```text
Premain-Class: Probe
Can-Retransform-Classes: true
```

打包与启动：

```powershell
jar cfm probe.jar MANIFEST.MF Probe.class
java -javaagent:probe.jar -Dprobe.class=com.example.Target -jar app.jar
```

输出直接混在程序自己的 stdout 里：

```text
[probe] getDeviceId() = ……
[probe] field cachedId = ……
```

比起"读代码 → 猜想算法 → 自己实现 → 对不上 → 回去改"，这条路通常几分钟就出结果。

> 如果启动过早（拿到 null），把 `sleep` 加大，或者用 `Instrumentation.addTransformer` + `retransformClasses` 在目标类首次加载时插桩，比固定 sleep 更稳。反过来，如果想看真实执行流而不是猜测，`ClassFileTransformer` 可以把每个方法的入参和返回值打出来——但信息量会大到需要过滤。

### 七、交叉验证：一个哈希实现的三种写法，和"陈旧静态值"的坑

拿到结果之后必须验证，否则你不知道自己读到的是"程序当前的真值"还是"某个历史缓存"。

#### 7.1 先确认摘要算法到底是什么

目标程序里有一个自实现的哈希类，用枚举选择算法。反编译能看到枚举常量名，但**名字可能是假的**——混淆器不改枚举值，但有人会故意改名字。所以必须用标准实现交叉验证。

```java
import java.security.MessageDigest;
import java.security.Security;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

Security.addProvider(new BouncyCastleProvider());

MessageDigest md = MessageDigest.getInstance("Keccak-384");   // BC 提供
byte[] out = md.digest("abc".getBytes(java.nio.charset.StandardCharsets.UTF_8));

StringBuilder sb = new StringBuilder();
for (byte b : out) sb.append(String.format("%02x", b));
System.out.println(sb);
// f7df1165f033337be098e7d288ad6a2f74409d7a60b49c36642218de161b1f99…
```

同时用纯 JDK 跑一遍对照：

```java
MessageDigest sha3 = MessageDigest.getInstance("SHA3-384");   // JDK 17 内置
```

**坑在这里：`Keccak-384` 和 `SHA3-384` 是完全不同的两个东西。** 输出长度一样（48 字节），但填充不同——Keccak 用 `0x01`，NIST 标准化后的 SHA3 用 `0x06`。哪怕输入只差一个空串，输出从第一个字节就不一样。

我第一次比对时用了 JDK 内置的 `SHA3-384`，结果和目标程序差得一塌糊涂，差点以为是推导的算法搞错了。换成 BouncyCastle 的 `Keccak-384` 之后逐字节相同。

换成 Python 也一样，注意模块名：

```python
from Crypto.Hash import keccak

h = keccak.new(digest_bits=384)
h.update(b"abc")
print(h.hexdigest())
# f7df1165f033337be098e7d288ad6a2f74409d7a60b49c36642218de161b1f99…
```

`hashlib.sha3_384` 是错的，`hashlib` 里没有 Keccak。这三处（BC / Crypto / JDK）的实现必须能互相印证，才能确定"我读懂了算法"这件事。

#### 7.2 "陈旧静态值"——一个会骗人的坑

程序里有个类，在静态初始化阶段就把某个值算好存进 `static` 字段。我用第六节的探针去读，读到了一个值，看起来完全合理。

问题是：**这个字段的初始化发生在它所依赖的输入刷新之前。**

反编译能看到初始化顺序：

```java
static class State {
    static String derived = compute();      // ← A：此时用的还是缓存里的旧值
    static void refresh() { cache = readFromDisk(); }   // ← B：真正刷新缓存的
}
```

执行顺序是 `A` 先跑，`B` 后跑。所以 `derived` 里装的是**用旧值算出来的结果**——格式正确、长度正确、看起来无可挑剔，但它不是当前的正确答案。

更隐蔽的变体是输入根本还没赋值：Java 里 `null + "salt"` 不抛异常，会老老实实拼成 `"nullsalt"`。于是你拿到一个格式完全合法、换谁看都像正常结果的十六进制串，而它其实是"输入还没准备好"的产物。我这次先怀疑公式推错、差点把整条推导推翻，回头查字段初始化顺序才发现读的是兜底值。

所以判据不能是"看起来对不对"，只能是"**能不能被独立重算复现**"。

这个坑的识别方法只有一个：**不要相信读到的字段值，自己按公式重算一遍，两者必须相等。**

```java
String fromField = Probe.read("…");     // 探针读到的
String recomputed = compute(currentInput);  // 按反编译出的公式自己算

System.out.println(fromField.equals(recomputed));
// false  → 字段是陈旧的，以重算为准，并回头检查初始化顺序
```

我最初的判断就栽在这里：把字段值当成了当前结果，发现跟重算对不上，第一反应是"公式推错了"。实际是字段值得的是旧输入下的产物。反过来修正判断后，公式一次通过。

**通用教训**：静态字段的 `值` 只反映它被赋值那一刻的世界，不反映现在。任何依赖外部状态（文件、机器信息、网络）的静态字段都有这个风险。

### 八、方法论小结

回头看，这两条捷径其实是同一个思路的两次应用：

| 路线 | 需要的理解 | 投入 | 结果 |
|---|---|---|---|
| 静态硬啃 | 完全理解 `tableswitch` 分派 + XOR/ROL 反馈 + 常量表布局 | 数天，且容易在细节上反复 | 需要重实现整套字符串表，再逐条对齐 |
| 反射执行解密器 | 认识 `static String a(int,int)` 这个形态 | 半小时 | 15,569 条明文，一次到位 |
| 重新实现哈希算法 | 读枚举 + 猜填充 | 半天，且极可能错（Keccak vs SHA3） | 需要拿标准实现交叉验证才能确认 |
| 进程内探针 | 会用 `java.lang.instrument` + `reflect` | 十分钟 | 直接拿运行时真值 |

三句话总结：

1. **混淆抬高的是阅读成本，不是执行成本。** 只要程序自己还要算这个值，它就是你能调用的一个函数。找到那个函数，而不是复制它的逻辑。
2. **反编译结果本身就是一份"调用参数清单"。** 你不需要推理该传什么参数——编译器早就把每个调用点固化成字面量了，正则抄下来即可。
3. **读到的任何值都要能被独立重算复现。** 不能复现的值，先怀疑它是陈旧的，而不是先怀疑自己的公式。

顺带一个反模式：**不要一开始就去解 `c.d(long)` 那个 id 映射表**。那看起来是最碍眼的东西（满屏 `invoke`），但它只是名字的编码，把字符串表和字段/方法签名对上之后，这层映射会自然透明。先从字符串表下手，成本最低、收益最大。

### 九、边界

本文讨论的是**混淆分析与调试技术本身**：如何识别混淆器指纹、如何用反射和 `java.lang.instrument` 减少逆向成本、如何用标准实现交叉验证算法识别结果。这些是通用的 Java 工程技能，在排查第三方 jar 崩溃、审计供应链、恢复自己丢失源码的项目里都用得上。

涉及的商业软件，其授权机制的具体常量与生成方法不在本文范围内，也不提供任何生成工具。如果你在做的事需要绕过授权，那正确的做法是去买授权——这跟技术上做不做得到是两件事。

技术上值得记的只有一件事：**一个把逻辑藏进运行时计算的程序，本质上是在信任"没人会运行它"。而这是个错误的假设。**

### 参考资料

- [JEP 275: Modularize the Pack200 APIs](https://openjdk.org/jeps/275) —— pack200 从 JDK 14 起标记移除，JDK 17 中 `unpack200` 已不存在
- [Allatori Java Obfuscator 官方文档](https://allatori.com/) —— 字符串加密与流混淆的说明，可用于对照指纹
- [`java.lang.instrument` 包文档](https://docs.oracle.com/en/java/javase/17/docs/api/java.instrument/java/lang/instrument/package-summary.html) —— `premain` / `ClassFileTransformer` / `retransformClasses`
- [`java.lang.reflect.Method`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/reflect/Method.html) —— 静态方法 `invoke` 的实例参数传 `null`
- [BouncyCastle Java 密码库](https://www.bouncycastle.org/) —— 提供 `Keccak-384`（JDK 只内置 `SHA3-384`）
- [PyCryptodome `Crypto.Hash.keccak`](https://pycryptodome.readthedocs.io/en/latest/src/hash/keccak.html) —— Python 侧的对照实现
- [CFR 反编译器](https://www.benf.org/other/cfr/) —— 处理混淆代码比 jadx 更稳
