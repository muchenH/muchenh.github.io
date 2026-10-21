import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import site from '../../site.config.js';
import { makeExcerpt, renderMarkdown } from './markdown.js';
import {
  readingTime,
  slugifyTerm,
  truncate,
} from './utils.js';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const postsDir = path.join(rootDir, 'content', 'posts');
const pagesDir = path.join(rootDir, 'content', 'pages');
const mediaDir = path.join(rootDir, 'content', 'media');

function parseFrontMatter(raw) {
  const content = raw.replace(/^\uFEFF/, '');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    return { data: {}, body: content };
  }
  let data = {};
  try {
    data = yaml.load(match[1]) || {};
  } catch (error) {
    throw new Error(`YAML front matter 解析失败: ${error.message}`);
  }
  return { data, body: content.slice(match[0].length) };
}

function parseDate(raw, data, fallbackDate) {
  const match = raw.match(
    /^date:\s*['"]?(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/m,
  );
  if (match) {
    return {
      year: match[1],
      month: match[2],
      day: match[3],
      time: match[4] ? `${match[4]}:${match[5]}` : '00:00',
    };
  }

  if (data.date instanceof Date && !Number.isNaN(data.date.getTime())) {
    return {
      year: String(data.date.getFullYear()),
      month: String(data.date.getMonth() + 1).padStart(2, '0'),
      day: String(data.date.getDate()).padStart(2, '0'),
      time: `${String(data.date.getHours()).padStart(2, '0')}:${String(
        data.date.getMinutes(),
      ).padStart(2, '0')}`,
    };
  }

  return {
    year: String(fallbackDate.getFullYear()),
    month: String(fallbackDate.getMonth() + 1).padStart(2, '0'),
    day: String(fallbackDate.getDate()).padStart(2, '0'),
    time: '00:00',
  };
}

function stripLeadingDuplicateTitle(body, title) {
  const match = body.match(/^\s*#\s+([^\r\n]+)(?:\r?\n|$)/);
  if (!match) return body;
  const headingText = match[1]
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '')
    .trim();
  const normalize = (value) => value.replace(/[\s\u3000]+/g, '').toLowerCase();
  if (normalize(headingText) !== normalize(String(title))) return body;
  return body.slice(match[0].length).replace(/^\s*\r?\n/, '');
}

function toArray(value) {
  if (value === undefined || value === null || value === '') return [];
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
}

function safeSlug(value) {
  return String(value)
    .trim()
    .replace(/[\\/?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^\.+$/, '')
    .trim();
}

function readAboutPage() {
  const filePath = path.join(pagesDir, 'about.md');
  if (!fs.existsSync(filePath)) {
    return {
      title: '关于',
      description: '',
      html: '<p>这里还没有内容。</p>',
      headings: [],
      text: '',
    };
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, body } = parseFrontMatter(raw);
  const rendered = renderMarkdown(body, '/about/');
  return {
    title: data.title || '关于',
    description: data.description || '',
    html: rendered.html,
    headings: rendered.headings,
    text: rendered.text,
  };
}

function collectImageWarnings(html, fileName) {
  const warnings = [];
  const seen = new Set();
  for (const match of html.matchAll(/\bsrc="([^"]+)"/g)) {
    const source = match[1];
    if (!source || /^(?:[a-z]+:)?\/\//i.test(source) || source.startsWith('data:')) continue;
    if (seen.has(source)) continue;
    seen.add(source);
    const normalized = source.replace(/\\/g, '/');
    const mediaIndex = normalized.indexOf('media/');
    if (mediaIndex < 0) continue;
    const relative = decodeURIComponent(normalized.slice(mediaIndex + 'media/'.length));
    const filePath = path.join(mediaDir, relative);
    if (!fs.existsSync(filePath)) {
      warnings.push(`${fileName} → 找不到图片 /media/${relative}`);
    }
  }
  return warnings;
}

function buildTermIndex(posts, field) {
  const map = new Map();
  for (const post of posts) {
    for (const name of post[field]) {
      if (!map.has(name)) {
        map.set(name, { name, posts: [] });
      }
      map.get(name).posts.push(post);
    }
  }

  const usedSlugs = new Map();
  return [...map.values()]
    .map((entry) => {
      const baseSlug = slugifyTerm(entry.name);
      const count = usedSlugs.get(baseSlug) || 0;
      usedSlugs.set(baseSlug, count + 1);
      return {
        ...entry,
        slug: count === 0 ? baseSlug : `${baseSlug}-${count + 1}`,
        count: entry.posts.length,
        latest: entry.posts[0],
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export function loadContent() {
  if (!fs.existsSync(postsDir)) {
    throw new Error(`找不到文章目录: ${postsDir}`);
  }

  const files = fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();

  const warnings = [];
  const usedPaths = new Map();
  const posts = [];

  for (const fileName of files) {
    const filePath = path.join(postsDir, fileName);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, body } = parseFrontMatter(raw);

    if (data.draft === true) continue;

    const stats = fs.statSync(filePath);
    const date = parseDate(raw, data, stats.mtime);
    const title = String(data.title || path.basename(fileName, '.md')).trim();
    const slug = safeSlug(data.slug || path.basename(fileName, '.md')) || 'post';
    const urlPath = `/${date.year}/${date.month}/${date.day}/${slug}/`;
    const categories = toArray(data.categories ?? data.category);
    const tags = toArray(data.tags);
    const normalizedCategories = categories.length ? categories : ['未分类'];

    if (usedPaths.has(urlPath)) {
      warnings.push(
        `文章路径重复: ${urlPath}（${usedPaths.get(urlPath)} 与 ${fileName}）`,
      );
    }
    usedPaths.set(urlPath, fileName);

    const rendered = renderMarkdown(stripLeadingDuplicateTitle(body, title), urlPath);
    const description = data.description
      ? truncate(String(data.description), 160)
      : makeExcerpt(rendered.html, title);

    posts.push({
      fileName,
      title,
      slug,
      urlPath,
      date,
      dateKey: `${date.year}-${date.month}-${date.day}T${date.time}`,
      categories: normalizedCategories,
      category: normalizedCategories[0],
      tags,
      description,
      draft: false,
      html: rendered.html,
      headings: rendered.headings,
      text: rendered.text,
      readingTime: readingTime(rendered.text),
      searchText: truncate(`${rendered.text}`, 1800),
    });

    warnings.push(...collectImageWarnings(rendered.html, fileName));
  }

  posts.sort(
    (a, b) => b.dateKey.localeCompare(a.dateKey) || a.title.localeCompare(b.title, 'zh-CN'),
  );

  posts.forEach((post, index) => {
    post.newer = index > 0 ? posts[index - 1] : null;
    post.older = index < posts.length - 1 ? posts[index + 1] : null;
  });

  const categories = buildTermIndex(posts, 'categories');
  const tags = buildTermIndex(posts, 'tags');

  const categoryByName = new Map(categories.map((entry) => [entry.name, entry]));
  const tagByName = new Map(tags.map((entry) => [entry.name, entry]));

  for (const post of posts) {
    post.categorySlugs = post.categories.map((name) => categoryByName.get(name)?.slug).filter(Boolean);
    post.tagSlugs = post.tags.map((name) => tagByName.get(name)?.slug).filter(Boolean);
  }

  const latest = posts[0] || null;
  const earliestYear = posts.reduce(
    (year, post) => Math.min(year, Number(post.date.year)),
    site.since,
  );

  return {
    posts,
    categories,
    tags,
    categoryByName,
    tagByName,
    about: readAboutPage(),
    stats: {
      posts: posts.length,
      categories: categories.length,
      tags: tags.length,
      words: posts.reduce((sum, post) => sum + post.text.length, 0),
      latest,
      earliestYear,
      latestYear: latest ? Number(latest.date.year) : new Date().getFullYear(),
    },
    warnings,
  };
}
