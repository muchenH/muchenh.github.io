import site from '../../site.config.js';
import {
  absoluteUrl,
  escapeHtml,
  formatArchiveDate,
  formatDisplayDate,
  formatShortDate,
  hashHue,
  toDateTime,
  withBase,
} from './utils.js';

const icons = {
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>',
  sun:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>',
  moon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"></path></svg>',
  auto:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 3.5a8.5 8.5 0 0 0 0 17Z" fill="currentColor" stroke="none"></path></svg>',
  menu:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>',
  close:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"></path></svg>',
  arrowLeft:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"></path><path d="m11 6-6 6 6 6"></path></svg>',
  arrowRight:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg>',
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.51-1.11-1.51-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.34 9.34 0 0 1 12 6.98c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.05 10.05 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"></path></svg>',
  arrowUp:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"></path><path d="m6 11 6-6 6 6"></path></svg>',
  hash:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M10 3 8 21M16 3l-2 18M4 9h17M3 15h17"></path></svg>',
  clock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg>',
  copy:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>',
};

export function href(path) {
  return escapeHtml(withBase(path));
}

function navItem(item, activeKey, className = 'nav-link') {
  const active = item.key === activeKey;
  return `<a class="${className}${active ? ' is-active' : ''}" href="${href(
    item.path,
  )}"${active ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a>`;
}

function brand() {
  const name = site.author;
  const mark = [...name][0] || '·';
  return `<a class="brand" href="${href('/')}" aria-label="${escapeHtml(
    site.title,
  )} 首页"><span class="brand-mark" aria-hidden="true">${escapeHtml(
    mark,
  )}</span><span class="brand-name">${escapeHtml(name)}</span></a>`;
}

function themeSwitcher() {
  return `<button class="icon-button theme-toggle" id="theme-toggle" type="button" aria-label="切换明暗主题" title="切换明暗主题">
        <span class="theme-icon" data-theme-icon="auto">${icons.auto}</span>
        <span class="theme-icon" data-theme-icon="light">${icons.sun}</span>
        <span class="theme-icon" data-theme-icon="dark">${icons.moon}</span>
      </button>`;
}

function header(activeKey) {
  return `<header class="site-header">
      <div class="shell header-inner">
        ${brand()}
        <nav class="primary-nav" aria-label="主导航">
          ${site.navigation.map((item) => navItem(item, activeKey)).join('')}
        </nav>
        <div class="header-actions">
          <button class="search-trigger" id="search-open" type="button" aria-label="搜索文章" title="搜索文章 (Ctrl K)">
            ${icons.search}<span class="search-trigger-label">搜索</span><kbd class="search-trigger-kbd">Ctrl K</kbd>
          </button>
          ${themeSwitcher()}
          <button class="icon-button nav-toggle" id="nav-toggle" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="mobile-panel">
            <span class="nav-toggle-open">${icons.menu}</span><span class="nav-toggle-close">${icons.close}</span>
          </button>
        </div>
      </div>
      <div class="mobile-panel" id="mobile-panel" hidden>
        <nav class="mobile-nav" aria-label="移动端导航">
          ${site.navigation.map((item) => navItem(item, activeKey, 'mobile-nav-link')).join('')}
        </nav>
        <div class="mobile-panel-foot">
          <a href="${escapeHtml(site.github)}" target="_blank" rel="noopener noreferrer">${icons.github} GitHub</a>
        </div>
      </div>
    </header>`;
}

function searchDialog() {
  return `<dialog class="search-dialog" id="search-dialog" aria-labelledby="search-title">
      <div class="search-panel">
        <div class="search-head">
          ${icons.search}
          <label class="sr-only" for="search-input" id="search-title">搜索文章</label>
          <input id="search-input" type="search" placeholder="搜索标题、标签或正文…" autocomplete="off" spellcheck="false">
          <button class="search-esc" type="button" data-search-close aria-label="关闭搜索">Esc</button>
        </div>
        <div class="search-body" id="search-results" aria-live="polite">
          <p class="search-hint">输入关键词，搜索全站文章。</p>
        </div>
        <div class="search-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>Enter</kbd> 打开</span>
          <span><kbd>Esc</kbd> 关闭</span>
        </div>
      </div>
    </dialog>`;
}

function footer(stats) {
  const currentYear = new Date().getFullYear();
  const startYear = stats.earliestYear;
  const yearRange = startYear === currentYear ? `${startYear}` : `${startYear}–${currentYear}`;
  return `<footer class="site-footer">
      <div class="shell footer-grid">
        <div class="footer-brand">
          ${brand()}
          <p>${escapeHtml(site.footerNote)}</p>
        </div>
        <div class="footer-col">
          <p class="footer-heading">浏览</p>
          ${site.navigation
            .slice(1)
            .map((item) => `<a href="${href(item.path)}">${escapeHtml(item.label)}</a>`)
            .join('')}
        </div>
        <div class="footer-col">
          <p class="footer-heading">连接</p>
          <a href="${escapeHtml(site.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="#top">回到顶部 ↑</a>
        </div>
      </div>
      <div class="shell footer-bottom">
        <p>© ${yearRange} ${escapeHtml(site.author)}</p>
        <p>用 Markdown 写作，由一个小巧的静态生成器构建。</p>
      </div>
    </footer>`;
}

function layout({
  title,
  description,
  path,
  bodyClass = '',
  activeKey = '',
  content,
  stats,
  ogType = 'website',
  publishedTime = '',
  keywords = '',
  jsonLd = null,
}) {
  const pageTitle = title ? `${title} — ${site.title}` : `${site.title} — ${site.tagline}`;
  const metaDescription = description || site.description;
  const canonical = absoluteUrl(path);
  const base = escapeHtml(withBase('/'));
  const themeScript = `(function(){try{var r=document.documentElement;var s=localStorage.getItem('theme-mode')||'auto';if(s!=='auto'&&s!=='light'&&s!=='dark'){s='auto'}var h=new Date().getHours();var dark=s==='dark'||(s==='auto'&&(h>=${site.theme.autoDarkStart}||h<${site.theme.autoDarkEnd}));r.dataset.theme=dark?'dark':'light';r.dataset.themeMode=s;}catch(e){document.documentElement.dataset.theme='light';document.documentElement.dataset.themeMode='auto';}})();`;
  const ogTitle = escapeHtml(pageTitle);
  const ogDescription = escapeHtml(metaDescription);
  const structuredData = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(site.lang)}" data-theme="light" data-theme-mode="auto" data-base="${base}" data-auto-start="${site.theme.autoDarkStart}" data-auto-end="${site.theme.autoDarkEnd}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>${themeScript}</script>
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${ogDescription}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta name="author" content="${escapeHtml(site.author)}">
  <meta name="theme-color" content="#f7f6f2" id="theme-color">
  <meta property="og:site_name" content="${escapeHtml(site.title)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:locale" content="zh_CN">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  ${publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}">` : ''}
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : ''}
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.title)}" href="${href('/feed.xml')}">
  <link rel="icon" href="${href('/favicon.svg')}" type="image/svg+xml">
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/misans@5.0.0/lib/Normal/MiSans-Medium.min.css">
  <link rel="stylesheet" href="${href('/assets/main.css')}">
  ${structuredData}
</head>
<body class="${bodyClass}" id="top">
  <a class="skip-link" href="#main">跳到正文</a>
  ${header(activeKey)}
  ${content}
  ${footer(stats)}
  <div class="eye-care-hint" id="eye-care-hint" role="status" aria-live="polite"></div>
  ${searchDialog()}
  <script src="${href('/assets/main.js')}" defer></script>
</body>
</html>`;
}

function categoryBadge(post, tag = 'span') {
  return `<${tag} class="category-badge" style="--hue:${hashHue(
    post.category,
  )}">${escapeHtml(post.category)}</${tag}>`;
}

function postItem(post, index) {
  return `<li class="post-item" style="--i:${index}">
      <a class="post-link" href="${href(post.urlPath)}">
        <time class="post-date" datetime="${escapeHtml(toDateTime(post.date))}">${formatShortDate(
          post.date,
        )}</time>
        <div class="post-main">
          <h3 class="post-title">${escapeHtml(post.title)}</h3>
          <p class="post-excerpt">${escapeHtml(post.description)}</p>
          <div class="post-meta">
            ${categoryBadge(post)}
            <span class="meta-item">${escapeHtml(post.readingTime)}</span>
          </div>
        </div>
        <span class="post-arrow" aria-hidden="true">${icons.arrow}</span>
      </a>
    </li>`;
}

function postList(posts) {
  return `<ol class="post-list">${posts.map((post, index) => postItem(post, index)).join('')}</ol>`;
}

function topicRow(categories) {
  return `<div class="shell topic-bar">
      <span class="topic-label">专题</span>
      <div class="topic-list">
        ${categories
          .slice(0, 7)
          .map(
            (category) => `<a class="topic" href="${href(
              `/categories/${category.slug}/`,
            )}">${escapeHtml(category.name)}<span>${category.count}</span></a>`,
          )
          .join('')}
      </div>
      <a class="topic-all" href="${href('/categories/')}">全部分类 ${icons.arrowRight}</a>
    </div>`;
}

function tocList(headings) {
  return `<ul class="toc-list">${headings
    .map(
      (heading) =>
        `<li class="toc-depth-${heading.depth}"><a href="#${escapeHtml(
          heading.id,
        )}">${escapeHtml(heading.text)}</a></li>`,
    )
    .join('')}</ul>`;
}

export function renderHome(content) {
  const latest = content.posts.slice(0, site.homePostLimit);
  const hero = `<main id="main">
    <section class="hero shell">
      <div class="hero-main">
        <p class="eyebrow"><span class="status-dot"></span>${escapeHtml(site.hero.eyebrow)}</p>
        <h1 class="hero-title">${escapeHtml(site.hero.titleLead)}<span class="accent">${escapeHtml(
          site.hero.titleAccent,
        )}</span></h1>
        <p class="hero-desc">${escapeHtml(site.hero.description)}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="${href('/archives/')}">浏览文章 ${icons.arrowRight}</a>
          <a class="button button-ghost" href="${escapeHtml(
            site.github,
          )}" target="_blank" rel="noopener noreferrer">${icons.github} GitHub</a>
        </div>
      </div>
      <aside class="hero-card">
        <div class="hero-card-head"><span class="hero-card-dot"></span>关于这个站点</div>
        <p class="hero-quote">“${escapeHtml(site.hero.quote)}”</p>
        <dl class="stats">
          <div><dt>文章</dt><dd>${content.stats.posts}</dd></div>
          <div><dt>分类</dt><dd>${content.stats.categories}</dd></div>
          <div><dt>标签</dt><dd>${content.stats.tags}</dd></div>
        </dl>
        <p class="hero-updated">最近更新 <time datetime="${escapeHtml(
          content.stats.latest ? toDateTime(content.stats.latest.date) : '',
        )}">${content.stats.latest ? formatShortDate(content.stats.latest.date) : '—'}</time></p>
      </aside>
    </section>
    ${topicRow(content.categories)}
    <section class="shell section latest-section">
      <div class="section-head">
        <h2 class="section-title">最新文章</h2>
        <a class="more-link" href="${href('/archives/')}">全部 ${
          content.stats.posts
        } 篇 ${icons.arrowRight}</a>
      </div>
      ${postList(latest)}
    </section>
  </main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.title,
    description: site.description,
    url: absoluteUrl('/'),
    author: {
      '@type': 'Person',
      name: site.author,
      url: site.github,
    },
  };

  return layout({
    title: '',
    description: site.description,
    path: '/',
    bodyClass: 'home-page',
    activeKey: 'home',
    content: hero,
    stats: content.stats,
    jsonLd,
  });
}

export function renderPost(post, content) {
  const toc = post.headings.length >= 2;
  const mobileToc = toc
    ? `<details class="toc-mobile">
        <summary>${icons.hash}<span>目录</span><span class="toc-mobile-count">${post.headings.length}</span></summary>
        <nav class="toc-mobile-nav" aria-label="文章目录">${tocList(post.headings)}</nav>
      </details>`
    : '';

  const tags = post.tags.length
    ? `<div class="article-tags">
        <span class="article-tags-label">标签</span>
        ${post.tags
          .map(
            (tag) =>
              `<a class="tag-chip tag-chip-small" href="${href(
                `/tags/${content.tagByName.get(tag)?.slug || ''}/`,
              )}">${escapeHtml(tag)}</a>`,
          )
          .join('')}
      </div>`
    : '';

  const postNav = `<nav class="post-nav" aria-label="文章导航">
      ${
        post.older
          ? `<a class="post-nav-card post-nav-older" href="${href(post.older.urlPath)}">
              <span class="post-nav-label">${icons.arrowLeft} 更早一篇</span>
              <span class="post-nav-title">${escapeHtml(post.older.title)}</span>
            </a>`
          : ''
      }
      ${
        post.newer
          ? `<a class="post-nav-card post-nav-newer" href="${href(post.newer.urlPath)}">
              <span class="post-nav-label">更新一篇 ${icons.arrowRight}</span>
              <span class="post-nav-title">${escapeHtml(post.newer.title)}</span>
            </a>`
          : ''
      }
    </nav>`;

  const article = `<div class="reading-progress" aria-hidden="true"><span id="reading-progress-bar"></span></div>
    <main id="main">
      <article class="article-shell shell${toc ? ' has-toc' : ' no-toc'}">
        <div class="article-main">
          <nav class="breadcrumb" aria-label="面包屑">
            <a href="${href('/')}">首页</a><span aria-hidden="true">/</span><a href="${href(
              '/archives/',
            )}">文章</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(
              post.category,
            )}</span>
          </nav>
          <header class="article-header">
            <div class="article-kicker">
              <a class="category-badge" style="--hue:${hashHue(
                post.category,
              )}" href="${href(
                `/categories/${content.categoryByName.get(post.category)?.slug || ''}/`,
              )}">${escapeHtml(post.category)}</a>
              <span class="meta-sep" aria-hidden="true">·</span>
              <time datetime="${escapeHtml(toDateTime(post.date))}">${formatDisplayDate(
                post.date,
              )}</time>
              <span class="meta-sep" aria-hidden="true">·</span>
              <span>${escapeHtml(post.readingTime)}</span>
            </div>
            <h1 class="article-title">${escapeHtml(post.title)}</h1>
          </header>
          ${mobileToc}
          <div class="prose post-prose" id="article-content">${post.html}</div>
          <footer class="article-footer">
            ${tags}
            ${postNav}
            <div class="author-card">
              <span class="author-mark" aria-hidden="true">${escapeHtml(
                [...site.author][0] || '·',
              )}</span>
              <div class="author-info">
                <p class="author-name">${escapeHtml(site.author)}</p>
                <p class="author-desc">${escapeHtml(
                  site.tagline,
                )}，记录 Linux、Docker 与代码。</p>
              </div>
              <a class="author-link" href="${escapeHtml(
                site.github,
              )}" target="_blank" rel="noopener noreferrer" aria-label="GitHub">${icons.github}</a>
            </div>
            <a class="back-home" href="${href('/')}">${icons.arrowLeft} 返回首页</a>
          </footer>
        </div>
        ${
          toc
            ? `<aside class="toc-aside">
                <p class="toc-title">目录<span>${post.headings.length}</span></p>
                <nav class="toc" aria-label="文章目录">${tocList(post.headings)}</nav>
              </aside>`
            : ''
        }
      </article>
    </main>
    <button class="to-top" id="to-top" type="button" aria-label="回到顶部" title="回到顶部">${icons.arrowUp}</button>
    <dialog class="lightbox" id="lightbox" aria-label="查看大图">
      <button class="lightbox-close" type="button" aria-label="关闭大图">${icons.close}</button>
      <figure>
        <img alt="">
        <figcaption></figcaption>
      </figure>
    </dialog>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: toDateTime(post.date),
    author: {
      '@type': 'Person',
      name: site.author,
      url: site.github,
    },
    publisher: {
      '@type': 'Person',
      name: site.author,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(post.urlPath),
    },
    url: absoluteUrl(post.urlPath),
    keywords: post.tags.join(', '),
    inLanguage: site.lang,
  };

  return layout({
    title: post.title,
    description: post.description,
    path: post.urlPath,
    bodyClass: 'post-page',
    activeKey: '',
    content: article,
    stats: content.stats,
    ogType: 'article',
    publishedTime: toDateTime(post.date),
    keywords: post.tags.join(', '),
    jsonLd,
  });
}

export function renderArchive(content) {
  const groups = new Map();
  for (const post of content.posts) {
    if (!groups.has(post.date.year)) groups.set(post.date.year, []);
    groups.get(post.date.year).push(post);
  }

  const body = `<main id="main">
      <section class="shell page-hero">
        <p class="eyebrow">ARCHIVE / 归档</p>
        <h1 class="page-title">所有文章</h1>
        <p class="page-desc">共 ${content.stats.posts} 篇，从 ${
          content.stats.earliestYear
        } 年写到现在。按时间倒序排列，偶尔翻翻旧文也不错。</p>
      </section>
      <section class="shell archive-body">
        ${[...groups.entries()]
          .map(
            ([year, posts]) => `<section class="archive-group">
              <h2 class="archive-year">${year}<span>${posts.length} 篇</span></h2>
              <ol class="archive-list">
                ${posts
                  .map(
                    (post) => `<li class="archive-item">
                      <a href="${href(post.urlPath)}">
                        <time datetime="${escapeHtml(toDateTime(post.date))}">${formatArchiveDate(
                          post.date,
                        )}</time>
                        <span class="archive-title">${escapeHtml(post.title)}</span>
                        <span class="archive-category">${escapeHtml(post.category)}</span>
                      </a>
                    </li>`,
                  )
                  .join('')}
              </ol>
            </section>`,
          )
          .join('')}
      </section>
    </main>`;

  return layout({
    title: '归档',
    description: `${site.author} 的全部 ${content.stats.posts} 篇文章归档。`,
    path: '/archives/',
    bodyClass: 'archive-page',
    activeKey: 'archives',
    content: body,
    stats: content.stats,
  });
}

export function renderTags(content) {
  const body = `<main id="main">
      <section class="shell page-hero">
        <p class="eyebrow">TAGS / 标签</p>
        <h1 class="page-title">标签</h1>
        <p class="page-desc">共 ${content.stats.tags} 个标签。按文章数量排序，点击查看相关内容。</p>
      </section>
      <section class="shell term-cloud-section">
        <div class="tag-cloud">
          ${content.tags
            .map(
              (tag) => `<a class="tag-chip" href="${href(`/tags/${tag.slug}/`)}">${escapeHtml(
                tag.name,
              )}<span>${tag.count}</span></a>`,
            )
            .join('')}
        </div>
      </section>
    </main>`;

  return layout({
    title: '标签',
    description: `${site.author} 博客的全部标签。`,
    path: '/tags/',
    bodyClass: 'tags-page',
    activeKey: 'tags',
    content: body,
    stats: content.stats,
  });
}

export function renderTag(tag, content) {
  const body = `<main id="main">
      <section class="shell page-hero term-hero">
        <p class="eyebrow"><a href="${href('/tags/')}">TAGS / 全部标签</a></p>
        <h1 class="page-title"><span class="term-prefix">#</span>${escapeHtml(tag.name)}</h1>
        <p class="page-desc">${tag.count} 篇相关文章，按时间倒序排列。</p>
      </section>
      <section class="shell term-posts">
        ${postList(tag.posts)}
      </section>
    </main>`;

  return layout({
    title: `标签：${tag.name}`,
    description: `与「${tag.name}」相关的 ${tag.count} 篇文章。`,
    path: `/tags/${tag.slug}/`,
    bodyClass: 'tag-page',
    activeKey: 'tags',
    content: body,
    stats: content.stats,
  });
}

export function renderCategories(content) {
  const body = `<main id="main">
      <section class="shell page-hero">
        <p class="eyebrow">CATEGORIES / 分类</p>
        <h1 class="page-title">分类</h1>
        <p class="page-desc">共 ${content.stats.categories} 个分类。文章按主题归档，适合顺着一个方向读下去。</p>
      </section>
      <section class="shell category-grid">
        ${content.categories
          .map(
            (category) => `<a class="category-card" href="${href(
              `/categories/${category.slug}/`,
            )}">
              <span class="category-card-dot" style="--hue:${hashHue(category.name)}"></span>
              <h2>${escapeHtml(category.name)}</h2>
              <p>${category.count} 篇文章</p>
              <span class="category-card-latest">最近：${escapeHtml(
                category.latest?.title || '',
              )}</span>
              <span class="category-card-arrow">${icons.arrow}</span>
            </a>`,
          )
          .join('')}
      </section>
    </main>`;

  return layout({
    title: '分类',
    description: `${site.author} 博客的全部文章分类。`,
    path: '/categories/',
    bodyClass: 'categories-page',
    activeKey: 'categories',
    content: body,
    stats: content.stats,
  });
}

export function renderCategory(category, content) {
  const body = `<main id="main">
      <section class="shell page-hero term-hero">
        <p class="eyebrow"><a href="${href('/categories/')}">CATEGORIES / 全部分类</a></p>
        <h1 class="page-title"><span class="category-title-dot" style="--hue:${hashHue(
          category.name,
        )}"></span>${escapeHtml(category.name)}</h1>
        <p class="page-desc">${category.count} 篇文章，按时间倒序排列。</p>
      </section>
      <section class="shell term-posts">
        ${postList(category.posts)}
      </section>
    </main>`;

  return layout({
    title: `分类：${category.name}`,
    description: `「${category.name}」分类下的 ${category.count} 篇文章。`,
    path: `/categories/${category.slug}/`,
    bodyClass: 'category-page',
    activeKey: 'categories',
    content: body,
    stats: content.stats,
  });
}

export function renderAbout(content) {
  const body = `<main id="main">
      <section class="shell page-hero about-hero">
        <div>
          <p class="eyebrow">ABOUT / 关于</p>
          <h1 class="page-title">关于</h1>
          <p class="page-desc">${escapeHtml(
            content.about.description || '记录折腾与思考，也记录那些踩过的坑。',
          )}</p>
        </div>
        <div class="about-avatar" aria-hidden="true">${escapeHtml(
          [...site.author][0] || '·',
        )}</div>
      </section>
      <section class="shell about-grid">
        <div class="prose about-prose">${content.about.html}</div>
        <aside class="about-card">
          <p class="about-card-name">${escapeHtml(site.author)}</p>
          <p class="about-card-role">${escapeHtml(site.tagline)}</p>
          <dl class="about-stats">
            <div><dt>文章</dt><dd>${content.stats.posts}</dd></div>
            <div><dt>分类</dt><dd>${content.stats.categories}</dd></div>
            <div><dt>标签</dt><dd>${content.stats.tags}</dd></div>
          </dl>
          <div class="about-card-links">
            <a href="${escapeHtml(site.github)}" target="_blank" rel="noopener noreferrer">${icons.github}<span>GitHub</span></a>
          </div>
          <p class="about-card-foot">Since ${content.stats.earliestYear}</p>
        </aside>
      </section>
    </main>`;

  return layout({
    title: '关于',
    description: `关于 ${site.author} 和他的博客。`,
    path: '/about/',
    bodyClass: 'about-page',
    activeKey: 'about',
    content: body,
    stats: content.stats,
  });
}

export function render404(content) {
  const body = `<main id="main" class="shell not-found">
      <p class="eyebrow">404 / NOT FOUND</p>
      <p class="not-found-code" aria-hidden="true">404</p>
      <h1>这条路走不通。</h1>
      <p class="not-found-desc">页面可能被移动或删除了，也可能是链接写错了。你可以回到首页，或者去归档里翻翻。</p>
      <div class="hero-actions">
        <a class="button button-primary" href="${href('/')}">回到首页 ${icons.arrowRight}</a>
        <a class="button button-ghost" href="${href('/archives/')}">浏览归档</a>
      </div>
    </main>`;

  return layout({
    title: '页面未找到',
    description: '页面未找到。',
    path: '/404.html',
    bodyClass: 'not-found-page',
    activeKey: '',
    content: body,
    stats: content.stats,
  });
}
