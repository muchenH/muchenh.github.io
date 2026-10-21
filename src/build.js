import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.js';
import { loadContent } from './lib/content.js';
import { render404, renderAbout, renderArchive, renderCategories, renderCategory, renderHome, renderPost, renderTag, renderTags } from './lib/templates.js';
import {
  absoluteUrl,
  escapeHtml,
  formatShortDate,
  toRfc822,
  withBase,
} from './lib/utils.js';

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const publicDir = path.join(rootDir, 'public');
const srcDir = path.join(rootDir, 'src');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(relativePath, contents) {
  const outputPath = path.join(publicDir, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, contents);
}

function copyFile(relativeSource, relativeTarget) {
  const target = path.join(publicDir, relativeTarget);
  ensureDir(path.dirname(target));
  fs.copyFileSync(path.join(srcDir, relativeSource), target);
}

function copyMedia() {
  const source = path.join(rootDir, 'content', 'media');
  const target = path.join(publicDir, 'media');
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, target, {
    recursive: true,
    filter: (filePath) => !filePath.endsWith('.DS_Store'),
  });
}

function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#1b1e1a"/>
  <path d="M16 46V19h7l9 15 9-15h7v27h-7V31l-9 14-9-14v15h-7Z" fill="#f7f6f2"/>
  <circle cx="49" cy="16" r="4" fill="#8ccfae"/>
</svg>`;
}

function buildSearchIndex(content) {
  return content.posts.map((post) => ({
    title: post.title,
    url: withBase(post.urlPath),
    date: formatShortDate(post.date),
    category: post.category,
    tags: post.tags,
    description: post.description,
    text: post.searchText,
  }));
}

function buildFeed(content) {
  const posts = content.posts.slice(0, site.feedLimit);
  const updated = content.stats.latest
    ? toRfc822(content.stats.latest.date)
    : new Date().toUTCString();
  const items = posts
    .map((post) => {
      const link = absoluteUrl(post.urlPath);
      const categories = post.tags
        .map((tag) => `      <category>${escapeHtml(tag)}</category>`)
        .join('\n');
      return `    <item>
      <title>${escapeHtml(post.title)}</title>
      <link>${escapeHtml(link)}</link>
      <guid isPermaLink="true">${escapeHtml(link)}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <description>${escapeHtml(post.description)}</description>
${categories}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(site.title)}</title>
    <link>${escapeHtml(absoluteUrl('/'))}</link>
    <description>${escapeHtml(site.description)}</description>
    <language>zh-cn</language>
    <lastBuildDate>${updated}</lastBuildDate>
    <atom:link href="${escapeHtml(absoluteUrl('/feed.xml'))}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

function buildSitemap(content) {
  const urls = [
    { path: '/', priority: '1.0' },
    { path: '/archives/', priority: '0.7' },
    { path: '/categories/', priority: '0.6' },
    { path: '/tags/', priority: '0.6' },
    { path: '/about/', priority: '0.4' },
    ...content.posts.map((post) => ({
      path: post.urlPath,
      priority: '0.8',
      lastmod: post.dateKey.slice(0, 10),
    })),
    ...content.categories.map((category) => ({
      path: `/categories/${category.slug}/`,
      priority: '0.5',
    })),
    ...content.tags.map((tag) => ({
      path: `/tags/${tag.slug}/`,
      priority: '0.5',
    })),
  ];

  const entries = urls
    .map(
      (url) => `  <url>
    <loc>${escapeHtml(absoluteUrl(url.path))}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''}
    <priority>${url.priority}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function outputPathForUrl(urlPath, fileName = 'index.html') {
  const clean = urlPath.replace(/^\/+|\/+$/g, '');
  return `${clean ? `${clean}/` : ''}${fileName}`;
}

export function build() {
  const start = performance.now();
  const content = loadContent();

  fs.rmSync(publicDir, { recursive: true, force: true });
  ensureDir(publicDir);
  copyMedia();
  copyFile('styles/main.css', 'assets/main.css');
  copyFile('scripts/main.js', 'assets/main.js');

  writeFile('index.html', renderHome(content));
  writeFile('404.html', render404(content));
  writeFile('archives/index.html', renderArchive(content));
  writeFile('tags/index.html', renderTags(content));
  writeFile('categories/index.html', renderCategories(content));
  writeFile('about/index.html', renderAbout(content));

  for (const tag of content.tags) {
    writeFile(`tags/${tag.slug}/index.html`, renderTag(tag, content));
  }

  for (const category of content.categories) {
    writeFile(
      `categories/${category.slug}/index.html`,
      renderCategory(category, content),
    );
  }

  for (const post of content.posts) {
    writeFile(outputPathForUrl(post.urlPath), renderPost(post, content));
  }

  writeFile('search.json', JSON.stringify(buildSearchIndex(content)));
  writeFile('feed.xml', buildFeed(content));
  writeFile('sitemap.xml', buildSitemap(content));
  writeFile('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`);
  writeFile('favicon.svg', favicon());
  writeFile('.nojekyll', '');
  if (site.cname) writeFile('CNAME', `${site.cname}\n`);

  const elapsed = Math.round(performance.now() - start);
  console.log(
    `构建完成 · ${content.posts.length} 篇文章 · ${content.categories.length} 个分类 · ${content.tags.length} 个标签 · ${elapsed}ms`,
  );
  console.log(`输出目录: ${path.relative(rootDir, publicDir)}`);
  if (content.warnings.length) {
    console.log(`\n有 ${content.warnings.length} 条内容提醒:`);
    for (const warning of [...new Set(content.warnings)]) {
      console.log(`  - ${warning}`);
    }
  }

  return content;
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    build();
  } catch (error) {
    console.error('构建失败:', error);
    process.exitCode = 1;
  }
}
