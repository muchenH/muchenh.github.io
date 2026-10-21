---
name: muchenh-blog-publisher
description: Write, preview, build, and publish Markdown articles for muchenH's static blog at D:\Blog (GitHub Pages, https://blog.muyc.site). Use when creating or editing posts, adding images, running local preview or build, changing site settings, or deploying updates through git and GitHub Actions.
---

# muchenH Blog 写作与发布

## 项目概况

- 项目根目录：`D:\Blog`，所有命令都在此目录执行。
- 线上站点：<https://blog.muyc.site>。
- 技术栈：Node.js 20+、原生 ESM、Marked、highlight.js，无前端框架。新机器首次运行前执行 `npm ci`。
- 内容文件：
  - `content/posts/*.md`：文章
  - `content/pages/about.md`：关于页
  - `content/media/`：图片资源
  - `site.config.js`：站点标题、域名、导航、主题时间等配置
  - `.github/workflows/deploy.yml`：GitHub Pages 发布工作流
- URL 规则：`/YYYY/MM/DD/<slug 或文件名>/`。**已有文章不得修改文件名、`date` 或 `slug`**，否则旧链接会失效。

## 新建文章

在 `D:\Blog` 运行：

```bash
node .qoder/skills/muchenh-blog-publisher/scripts/new-post.mjs "标题" --category "分类" --tags "标签1,标签2"
```

可选参数：`--slug english-slug`、`--draft`、`--date "2026-10-21 20:30:00"`。脚本会生成带 front matter 的文件并输出路径。

若脚本不可用，手动在 `content/posts/` 新建 `.md` 文件：

```markdown
---
title: "文章标题"
date: 2026-10-21 20:30:00
category: Windows
tags:
  - Windows
  - WSL
description: "一句话摘要，可省略"
slug: backup-wsl
draft: false
---
```

- `date` 使用 `YYYY-MM-DD` 或 `YYYY-MM-DD HH:mm:ss`，按 `+08:00` 解释；建议始终显式填写。
- `category` 为单个分类；`categories` 数组优先，第一项是主分类。不写会归入“未分类”。
- `tags` 可写单个值或 YAML 数组。
- `slug` 可选，用于固定英文地址；发布后不要再改。
- 标题包含 `:`、`#` 等 YAML 特殊字符时，用双引号包裹。
- `draft: true` 不会出现在网站、搜索和 RSS 中；完成后再改成 `false`。

## 内容规范

- 正文从 `##` 开始；不要再写与 `title` 重复的 `# 标题`。
- `##` / `###` 会自动进入文章目录，标题应简洁且唯一。
- 代码块标注语言（如 bash、js、python），代码高亮和复制按钮依赖语言标记。
- 图片放在 `content/media/<年>/<月>/<文件名>`，正文使用 `/media/<年>/<月>/<文件名>` 引用。
- 图片路径区分大小写，尽量只用英文、数字、`-`、`_`；alt 末尾加 `-w720` 可限制最大宽度。
- 表格在窄屏可横向滚动；原始 HTML 只放可信内容。

## 本地验证

在 `D:\Blog` 目录执行：

```bash
npm run dev      # http://localhost:4321，修改后自动重建
npm run build    # 生成静态文件到 public/
```

发布前检查：

1. `npm run build` 成功，且没有新增警告。
2. 新文章地址正确，草稿状态符合预期。
3. 图片文件存在，路径大小写与正文一致。
4. 大改样式时检查 320px 手机宽度和桌面宽度：无横向滚动、无遮挡。
5. `git status` 中不含 `node_modules/`、`public/`、`.env` 或任何令牌。

## 发布文章

在 `D:\Blog` 目录执行：

```bash
git status
git add content/ site.config.js src/ .github/ README.md
git commit -m "post: 文章标题"
git push
```

推送 `main` 后，GitHub Actions 的 **Deploy blog to GitHub Pages** 会自动构建并部署。在仓库 Actions 页面确认 `build` 和 `deploy` 都成功，再访问线上文章。只新增文章时，`git add content/` 即可。

首次更换仓库、配置自定义域名或排查 Actions 失败，见 `D:\Blog\README.md` 第 5 节。

## 硬性约束

- 绝不提交 `node_modules/`、`public/`、`.env`、GitHub Token 或任何访问令牌。
- 绝不从旧 Hexo 目录 `D:\Files\Harness\Hexo` 复制 `_config.yml` 中的令牌，也不要修改该目录。
- 不要直接编辑 `public/`，它是构建产物。
- 不要随意改已有文章的 `date`、文件名或 `slug`；确实需要改时，先告知用户旧链接会失效。
- 修改字体时保持 MiSans CDN 地址不变：`https://cdn.jsdelivr.net/npm/misans@5.0.0/lib/Normal/MiSans-Medium.min.css`。

## 常见问题

- **新文章没出现**：检查 `draft`、`.md` 扩展名、front matter 的 `---` 是否成对，并查看构建输出。
- **YAML 解析失败**：给含冒号、`#`、引号的值加双引号，检查缩进。
- **图片线上 404**：确认图片已提交到 `content/media/`，并核对 Linux 环境下的路径大小写。
- **端口占用**：PowerShell 执行 `$env:PORT=5000; npm run dev`。
- **Actions 失败**：确认 Settings → Pages → Source 为 GitHub Actions；本地运行 `npm ci && npm run build` 复现。
- **恢复跟随时间的主题**：浏览器 Console 执行 `localStorage.removeItem('theme-mode'); location.reload();`。

## 脚本

- `scripts/new-post.mjs`：生成 Markdown 文章骨架。需在项目根目录运行，脚本会校验 `package.json` 和 `content/posts/`。
