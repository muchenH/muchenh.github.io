# muchenH Blog

一个不依赖前端框架的静态博客：Markdown 写作，构建后得到纯 HTML / CSS / JS，直接部署到 GitHub Pages。

**项目位置：`D:\Blog`**

- 已从原 Hexo 站点迁入 41 篇文章、12 个分类、10 个标签和图片资源
- 保留原有文章路径：`/年/月/日/文件名/`，旧链接和搜索收录不会失效
- 自动明暗主题（默认 19:00–07:00 深色），点击按钮即可切换白天 / 夜间并记住选择
- 全站搜索、文章目录、阅读进度、代码高亮 / 一键复制、图片灯箱、RSS、站点地图、404 页面
- 桌面、平板、手机上都有适配，支持键盘操作和减少动效偏好

## 1. 本地准备

需要 **Node.js 20 或更高版本**（推荐 22 LTS）。

```bash
cd /d D:\Blog
npm install
npm run dev
```

PowerShell 中把第一行换成 `cd D:\Blog` 即可。

打开 <http://localhost:4321>。开发服务器会监听 `content/`、`src/` 和 `site.config.js`，改动后自动重新构建，刷新浏览器即可看到。

常用命令：

```bash
npm run dev     # 本地预览，默认端口 4321
npm run build   # 生成静态文件到 public/
npm run clean   # 删除 public/
```

端口被占用时可以换一个（PowerShell）：

```powershell
$env:PORT=5000; npm run dev
```

## 2. 目录结构

```text
D:\Blog\
├─ content/
│  ├─ posts/          # 所有文章，.md 文件
│  ├─ pages/about.md  # 关于页
│  └─ media/          # 图片、GIF 等资源
├─ src/
│  ├─ build.js        # 静态站点生成器
│  ├─ dev.js          # 本地预览服务器
│  ├─ lib/            # Markdown、模板、内容读取
│  ├─ styles/main.css # 全站样式与主题变量
│  └─ scripts/main.js # 主题、搜索、目录、灯箱等交互
├─ public/            # 构建产物，已加入 .gitignore
├─ site.config.js     # 站点标题、域名、导航、主题时间等
├─ .github/workflows/deploy.yml
├─ .qoder/skills/muchenh-blog-publisher/  # AI 写作与发布 skill
├─ package.json
└─ README.md
```

## 3. 写一篇文章

### 3.1 新建文件

在 `content/posts/` 下新建一个 `.md` 文件，例如：

```text
content/posts/在-Windows-上备份-WSL.md
```

也可以在 `D:\Blog` 打开终端，用 skill 自带的脚本生成带 front matter 的文章骨架：

```bash
node .qoder/skills/muchenh-blog-publisher/scripts/new-post.mjs "在 Windows 上备份 WSL" --category Windows --tags "Windows,WSL"
```

脚本支持 `--slug backup-wsl` 自定义地址、`--draft` 标记草稿。生成后直接编辑正文即可。

构建时会按“日期 + 文件名”生成访问地址。上面的文件如果 `date` 是 `2026-10-21`，文章地址就是：

```text
/2026/10/21/在-Windows-上备份-WSL/
```

已有文章请**不要随意改文件名**，否则旧链接会失效。新文章可以用 `slug` 指定更简洁的地址：

```yaml
slug: backup-wsl
```

地址会变成 `/2026/10/21/backup-wsl/`。

### 3.2 Front matter

文件开头用 `---` 包住的一段是文章的元信息：

```markdown
---
title: 在 Windows 上备份 WSL
date: 2026-10-21 20:30:00
category: Windows
tags:
  - Windows
  - WSL
description: 记录一次 WSL 发行版的备份与恢复过程。
slug: backup-wsl
draft: false
---

这里开始写正文。
```

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `title` | 建议 | 文章标题；没有时使用文件名 |
| `date` | 建议 | 格式 `YYYY-MM-DD` 或 `YYYY-MM-DD HH:mm:ss`，按 `+08:00` 解释 |
| `category` | 否 | 单个分类；不写归入“未分类” |
| `categories` | 否 | 分类数组，优先级高于 `category`；第一项作为主分类 |
| `tags` | 否 | 单个标签或 YAML 数组 |
| `description` | 否 | 列表摘要、搜索描述和 RSS 描述；不写会自动截取正文第一段 |
| `slug` | 否 | 自定义 URL 段；不写就用文件名（去掉 `.md`） |
| `draft` | 否 | 设为 `true` 后不会出现在构建结果里 |

分类、标签、归档和搜索索引都是构建时自动生成的，不需要手动维护。

### 3.3 Markdown 约定

支持 GFM 常用语法：表格、任务列表、代码围栏、自动链接、引用、脚注以外的常规排版等。

- **标题**：正文里的 `##` / `###` 会进入右侧目录（手机上是顶部折叠目录）；`#` 会自动降级为 `##`，避免一个页面出现两个主标题。
- **重复标题**：如果正文开头的 `# 标题` 和 front matter 的 `title` 相同，会被自动去掉，避免标题出现两次。
- **锚点**：所有标题自动生成 `id`，中文标题也有稳定锚点，可以直接分享 `#一级标题` 这样的链接。
- **代码块**：写在代码围栏里并标注语言，例如 ```` ```bash ````，会自动高亮、显示语言标签并提供复制按钮。
- **表格**：窄屏下自动允许横向滚动。
- **外链**：Markdown 里的外部链接会在新标签页打开；站内绝对链接会保持站内跳转。
- **原始 HTML**：可以写 `<img>`、`<details>` 等标签，内容由你自己维护，请只放入可信内容。

### 3.4 图片和附件

把图片放在 `content/media/` 下，推荐在文章中用**以 `/media/` 开头的绝对路径**引用：

```markdown
![WSL 备份界面](/media/2026/10/wsl-backup.png)
```

对应文件是：

```text
content/media/2026/10/wsl-backup.png
```

也兼容旧文章里的相对写法（例如 `./../media/...`），但新文章建议统一使用 `/media/...`。外部图片地址可以直接写 `https://...`。

图片可以带限制宽度的后缀（写在 alt 文本最后）：

```markdown
![截图-w720](/media/2026/10/screenshot.png)
```

这样图片最大宽度为 720px，不会在大屏上被拉得过宽。所有文章图片都会自动懒加载，点击可以打开灯箱查看大图。

图片路径建议只用英文、数字、下划线和连字符；如果文件名包含空格，URL 会自动编码，但部署到 Linux 服务器后大小写是敏感的，务必保持一致。

### 3.5 草稿和发布

```yaml
draft: true
```

构建时会跳过这篇草稿。改回 `false` 并重新构建后才会出现在网站、搜索和 RSS 中。

## 4. 站点设置与主题

主要设置都在 `site.config.js`：

```js
title: 'muchenH Blog',
tagline: '佛系摸鱼中',
author: 'muchenH',
url: 'https://blog.muyc.site',
basePath: '/',
cname: 'blog.muyc.site',
github: 'https://github.com/muchenH',
```

- `title`、`tagline`、`description`、`author`：站点标题、页脚和默认 SEO 信息
- `url`：生产环境完整域名；影响 canonical、RSS、sitemap 和分享卡片
- `basePath`：站点部署在域名根目录时写 `/`；部署到 `https://用户名.github.io/仓库名/` 时写 `/仓库名/`
- `cname`：自定义域名。使用自定义域名时保留；部署到项目站点时会被自动忽略
- `github`：页头和关于页的 GitHub 链接
- `since`：页脚版权起始年份
- `navigation`：顶部导航，默认是首页、归档、分类、标签、关于
- `feedLimit`、`homePostLimit`：RSS 条数和首页文章数

首页文案、站点引言和页脚文案也都在这个文件里；关于页正文在 `content/pages/about.md`。

### 字体

正文和界面字体使用 **MiSans Medium**，通过 jsDelivr 加载：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/misans@5.0.0/lib/Normal/MiSans-Medium.min.css">
```

字体栈在 `src/styles/main.css` 的 `--font-sans` 中，`"MiSans"` 排在最前。CDN 无法访问时，会自动回退到 Inter、苹方、微软雅黑等系统字体，不影响阅读。若以后想换字体，替换 `src/lib/templates.js` 里的字体样式地址，并把 `--font-sans` 的第一项改成对应字体名称即可。

### 明暗主题

右上角的主题按钮每次点击都会在白天和夜间模式之间直接切换：

- **未手动选择时**：跟随时间，在本地时间 19:00 到次日 07:00 使用深色，其余时间使用浅色
- **点击按钮后**：立即切换到相反模式，选择保存在浏览器 `localStorage` 的 `theme-mode` 键里，下次访问继续沿用
- **夜间护眼提示**：如果在 19:00–07:00 之间手动切到白天模式，桌面端会在鼠标旁、移动端会在屏幕底部短暂显示用眼提示，约 3 秒后自动消失；打开菜单或搜索时会主动收起

手动切换后会一直保持所选模式。想恢复“跟随时间”，在浏览器开发者工具 Console 中执行：

```js
localStorage.removeItem('theme-mode');
location.reload();
```

自动深色时段在 `site.config.js` 中调整：

```js
theme: {
  autoDarkStart: 19,
  autoDarkEnd: 7,
},
```

颜色变量在 `src/styles/main.css` 顶部的 `:root` 和 `[data-theme="dark"]` 中，例如浅色主题的 `--bg`、`--ink`、`--accent`，想换主色改这两组即可。

## 5. 部署到 GitHub Pages

当前配置对应自定义域名 **blog.muyc.site**，仓库为 `muchenh.github.io`。新站由 GitHub Actions 构建并发布，不需要 Hexo，也不需要把 `public/` 提交进仓库。

### 5.1 把源码放进仓库

推荐继续使用原来的 `https://github.com/muchenH/muchenh.github.io` 仓库，这样域名和旧文章地址都不变。原仓库的 `main` 里可能是 Hexo 生成的静态文件，替换前先做备份分支或标签：

```bash
git clone https://github.com/muchenH/muchenh.github.io.git
cd muchenh.github.io

# 备份当前线上版本，可随时找回
git tag pre-static-rebuild
git push origin pre-static-rebuild

# 清空旧的已跟踪文件，把新项目源码复制进来
git rm -r .
# 从 D:\Blog 复制源码到当前目录：
# 只复制源码，不要复制 node_modules/、public/、.preview/
git add .
git commit -m "rebuild blog as a static site"
git push origin main
```

如果你不想动旧仓库，也可以新建一个仓库，把源码推送到新仓库的 `main`。使用新仓库时，自定义域名的设置也要在新仓库里重新配置。

无论用哪种方式，**不要提交** `node_modules/`、`public/`、任何访问令牌或 `.env` 文件。仓库里的 `.gitignore` 已经排除了前两项。

### 5.2 启用 GitHub Actions 发布

1. 打开仓库的 **Settings → Pages**。
2. 把 **Build and deployment → Source** 改为 **GitHub Actions**。
3. 确认部署工作流存在：`.github/workflows/deploy.yml` 会在每次推送到 `main` 时运行，也可以在 **Actions → Deploy blog to GitHub Pages → Run workflow** 手动触发。
4. 等待 `build` 和 `deploy` 两个任务都变成绿色。部署完成后，Actions 页面会显示站点地址。

首次推送时如果 Pages 还没切换到 Actions，工作流可能在 `configure-pages` 或 `deploy` 步骤失败。按上面的顺序设置好 Source，再手动重跑一次即可。

### 5.3 自定义域名与 DNS

如果继续使用 `blog.muyc.site`：

1. 在 **Settings → Pages → Custom domain** 填入 `blog.muyc.site` 并保存。
2. 在域名服务商处配置 DNS：

   | 类型 | 主机记录 | 记录值 |
   | --- | --- | --- |
   | CNAME | `blog` | `muchenh.github.io` |

   记录值不要加 `https://`，也不要带路径；末尾的点视服务商要求决定，一般不需要。

3. 等 DNS 生效后回到 Pages 设置，开启 **Enforce HTTPS**。证书通常需要几分钟到几十分钟。

新站的每次构建都会在 `public/` 里生成 `CNAME` 文件；Pages 设置里的 Custom domain 是最终生效位置，两边保持同一个域名即可。

### 5.4 其他部署方式：项目站点

如果没有自定义域名，而是部署到 `https://muchenH.github.io/muchenh-blog/`：

1. 在 `site.config.js` 里修改：

   ```js
   url: 'https://muchenH.github.io',
   basePath: '/muchenh-blog/',
   ```

   `basePath` 只写仓库名前后的斜杠，不要带协议和域名。

2. 仓库名必须和 `basePath` 一致；CSS、图片、文章链接和搜索索引都会自动带上这个前缀。
3. `cname` 会自动停用，不需要手动删除。
4. 推送后重新运行 Actions。

也可以在 CI 里用环境变量设置（Linux 环境）：

```yaml
env:
  SITE_URL: https://muchenH.github.io
  BASE_PATH: /muchenh-blog/
```

Windows 的 Git Bash 会把 `BASE_PATH=/xxx/` 自动转换成 Windows 路径，导致构建出错误前缀。在本地要测试项目站点时，直接改 `site.config.js` 最稳妥，或在 PowerShell / cmd 里设置环境变量。

### 5.5 日常发布流程

```bash
# 1. 本地预览
npm run dev

# 2. 写新文章或改站点设置

# 3. 提交源码并推送
git add content/ site.config.js src/
git commit -m "post: WSL 备份笔记"
git push

# 4. 等 Actions 完成，刷新线上站点
```

`public/` 是构建产物，不要提交；GitHub Actions 会在云端执行 `npm run build`。

## 6. 迁移与已知内容问题

- 41 篇文章和图片已从原 Hexo 目录迁入 `content/`，旧 front matter 字段（如 `index_img`、`banner_img`）会保留但当前主题不使用。
- 构建时会检查文章引用的 `/media/...` 图片是否存在，并在终端给出提醒，但不会中断构建。
- 目前有一张旧图缺失：`content/posts/面向对象-异常.md` 引用了 `/media/14989636063700/001_异常示意图.png`。原 Hexo 目录中也没有这张图；把图片补到对应位置，或删除正文里那处引用即可。
- 旧站使用 Hexo 的 `hexo-deployer-git` 推送到 `main`。新站切换到 Actions 发布后，不要再运行旧的 `hexo deploy`，否则可能覆盖或干扰仓库内容。

## 7. 常见问题

**构建时提示 YAML front matter 解析失败**

检查文章开头是否只有一对 `---`，缩进是否正确。冒号后面的值如果包含 `#` 或特殊符号，建议用引号包起来：

```yaml
title: "一次 Docker 排错：从 502 到正常"
```

**新文章没出现**

确认 `draft` 不是 `true`，文件名以 `.md` 结尾，并查看终端构建日志是否报错。日期较旧的文章会排在列表后面，可以按 `/archives/` 查找。

**图片在本地正常，线上不显示**

先确认图片在 `content/media/` 下且已提交；再检查路径大小写。Windows 本地文件系统不区分大小写，GitHub Pages 的 Linux 环境区分。包含空格的文件名请使用 `/media/...` 形式并让浏览器自动编码。

**文章地址和以前不一样**

地址由 front matter 的 `date`、`slug` 或文件名决定。迁移时已保留原文件名和日期；新文章改了 `slug` / 文件名 / 日期，旧地址就会变。需要长期稳定的地址时，请固定这三项。

**GitHub Actions 失败**

先看失败步骤：

- `configure-pages` / `deploy`：确认 Settings → Pages → Source 已选 **GitHub Actions**
- 权限错误：确认仓库 Settings → Actions → General 允许工作流运行，工作流里已声明 `pages: write` 和 `id-token: write`
- 构建错误：在本地运行 `npm ci && npm run build` 复现，通常是 front matter 或图片路径问题

**自定义域名打不开或一直 404**

检查 DNS 的 CNAME 是否指向 `muchenh.github.io`，Pages 的 Custom domain 是否填写并保存，HTTPS 证书是否签发完成。刚改 DNS 时可能需要等待缓存刷新。

**手动切换后第二天没有跟随时间变化**

点击主题按钮会记住手动选择，这是预期行为。想恢复自动模式，在浏览器开发者工具 Console 中执行 `localStorage.removeItem('theme-mode')` 后刷新页面。

**搜索没有结果**

搜索索引在构建时生成到 `search.json`。确认构建成功、浏览器没有拦截对 `search.json` 的请求，并用标题、分类或标签中的关键词试试。

## 8. 安全提醒

- **不要把 GitHub Token、密码或任何访问令牌写进仓库**，包括代码注释和配置文件。GitHub Actions 发布使用仓库内置的 OIDC 权限，不需要个人访问令牌。
- 如果旧 Hexo 的 `_config.yml` 里曾经写入过 Token，请立即到 GitHub 的 **Settings → Developer settings → Personal access tokens** 撤销对应令牌，再重新生成只用于必要场景的凭据。
- 如果以后确实要用 Token 做部署，请放在 GitHub Actions Secrets 或本机环境变量里，不要提交到 Git。

## 9. 可选：部署到其他静态托管

构建产物就是 `public/` 目录，可以直接上传到任何静态托管服务：

- Cloudflare Pages：Build command `npm run build`，Output directory `public`
- Vercel / Netlify：同样使用 `npm run build` 和 `public`
- 自己的 Nginx：把 `public/` 作为站点根目录，配置 `try_files $uri $uri/ =404;`

如果托管在子路径下，记得同步修改 `site.config.js` 的 `basePath` 和 `url`。

## 10. AI 助手 Skill

写作和发布流程已整理为可移植 skill：

- 项目内路径：`.qoder/skills/muchenh-blog-publisher/`
- 可移植压缩包：`D:\Blog\muchenh-blog-publisher-skill.zip`
- 新建文章脚本：`.qoder/skills/muchenh-blog-publisher/scripts/new-post.mjs`

在 Qoder 中以 `D:\Blog` 打开项目后，可以直接描述“写一篇关于 XX 的文章并发布”，或调用 `/muchenh-blog-publisher`。使用其他 AI agent 时，解压压缩包并把 `muchenh-blog-publisher/` 文件夹放进该 agent 的 skills 目录；也可以直接复制项目内的 `.qoder/skills/muchenh-blog-publisher/`。请确保 agent 的工作目录是 `D:\Blog`。

手动调用脚本：

```bash
node .qoder/skills/muchenh-blog-publisher/scripts/new-post.mjs "文章标题" --category "分类" --tags "标签1,标签2"
```

加 `--draft` 创建草稿，加 `--slug backup-wsl` 固定英文地址。
