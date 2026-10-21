#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const USAGE = `用法: node .qoder/skills/muchenh-blog-publisher/scripts/new-post.mjs "标题" [选项]

选项:
  --category <分类>       设置分类
  --tags <标签1,标签2>    设置标签
  --slug <slug>           自定义 URL 段
  --date <时间>           指定日期，如 "2026-10-21 20:30:00"
  --draft                 标记为草稿
  -h, --help              显示帮助
`;

const args = process.argv.slice(2);
const options = { tags: [], draft: false };
let title = '';

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '-h' || arg === '--help') {
    console.log(USAGE);
    process.exit(0);
  }
  if (arg === '--draft') {
    options.draft = true;
    continue;
  }
  if (['--category', '--tags', '--slug', '--date'].includes(arg)) {
    const value = args[index + 1];
    if (!value) fail(`缺少 ${arg} 的值`);
    index += 1;
    if (arg === '--tags') {
      options.tags = value
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean);
    } else {
      options[arg.slice(2)] = value.trim();
    }
    continue;
  }
  if (arg.startsWith('--')) fail(`未知选项: ${arg}`);
  if (title) fail(`多余的参数: ${arg}`);
  title = arg;
}

if (!title) {
  console.error(USAGE);
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const candidates = [process.cwd(), path.resolve(scriptDir, '../../../..')];
const root = candidates.find(
  (dir) =>
    fs.existsSync(path.join(dir, 'package.json')) &&
    fs.existsSync(path.join(dir, 'content', 'posts')),
);
if (!root) {
  fail('找不到博客项目根目录。请在包含 package.json 和 content/posts 的 D:\\Blog 目录运行。');
}

const pad = (value) => String(value).padStart(2, '0');
const formatNow = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const dateValue = options.date || formatNow();
if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(dateValue)) {
  fail('--date 格式应为 YYYY-MM-DD 或 "YYYY-MM-DD HH:mm:ss"');
}
if (options.slug && !/^[\p{L}\p{N}_-]+$/u.test(options.slug)) {
  fail('--slug 只能包含中文、字母、数字、下划线和连字符');
}

const baseName = title
  .replace(/[\u0000-\u001f<>:"/\\|?*]/g, '')
  .replace(/\s+/g, '-')
  .replace(/^[.\-\s]+|[.\-\s]+$/g, '')
  .slice(0, 80);
if (!baseName) fail('标题中没有可用的文件名字符，请换一个标题。');

const quote = (value) => JSON.stringify(value);
const lines = ['---', `title: ${quote(title)}`, `date: ${dateValue}`];
if (options.category) lines.push(`category: ${quote(options.category)}`);
if (options.tags.length > 0) {
  lines.push('tags:');
  for (const tag of options.tags) lines.push(`  - ${quote(tag)}`);
}
if (options.slug) lines.push(`slug: ${quote(options.slug)}`);
lines.push(`draft: ${options.draft}`, '---', '', '## 背景', '', '在这里开始写正文。', '');

const target = path.join(root, 'content', 'posts', `${baseName}.md`);
if (fs.existsSync(target)) fail(`文件已存在：${target}`);

fs.writeFileSync(target, lines.join('\n'), 'utf8');

const datePath = dateValue.slice(0, 10).replaceAll('-', '/');
const urlSegment = options.slug || baseName;
console.log(`已创建: ${target}`);
console.log(`文章地址: /${datePath}/${encodeURIComponent(urlSegment)}/`);
console.log(
  options.draft
    ? '当前是草稿（draft: true），完成后改为 false 再发布。'
    : '已可直接预览和发布（draft: false）。',
);

function fail(message) {
  console.error(`错误: ${message}`);
  process.exit(1);
}
