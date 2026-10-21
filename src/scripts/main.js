(() => {
  'use strict';

  const root = document.documentElement;
  const basePath = (() => {
    const value = root.dataset.base || '/';
    return value.endsWith('/') ? value : `${value}/`;
  })();
  const autoDarkStart = Number(root.dataset.autoStart) || 19;
  const autoDarkEnd = Number(root.dataset.autoEnd) || 7;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* Theme -------------------------------------------------------------- */

  const THEME_COLORS = { light: '#f7f5f0', dark: '#0f1110' };
  const themeToggle = $('#theme-toggle');
  const eyeCareHint = $('#eye-care-hint');
  let eyeCareTimer = 0;

  function readStoredMode() {
    try {
      const value = localStorage.getItem('theme-mode');
      return ['auto', 'light', 'dark'].includes(value) ? value : 'auto';
    } catch {
      return 'auto';
    }
  }

  function isNightTime() {
    const hour = new Date().getHours();
    return hour >= autoDarkStart || hour < autoDarkEnd;
  }

  function resolveTheme(mode) {
    if (mode === 'light' || mode === 'dark') return mode;
    return isNightTime() ? 'dark' : 'light';
  }

  let themeMode = readStoredMode();

  function updateThemeColor(theme) {
    const meta = $('#theme-color');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
  }

  function renderTheme() {
    const resolved = resolveTheme(themeMode);
    root.dataset.theme = resolved;
    root.dataset.themeMode = themeMode;
    updateThemeColor(resolved);
    if (themeToggle) {
      const label = resolved === 'dark' ? '切换到白天模式' : '切换到夜间模式';
      themeToggle.setAttribute('aria-label', label);
      themeToggle.setAttribute('title', label);
    }
  }

  function setThemeMode(mode) {
    if (!['auto', 'light', 'dark'].includes(mode)) return;
    themeMode = mode;
    try {
      localStorage.setItem('theme-mode', mode);
    } catch {
      /* 忽略无痕模式下的存储异常 */
    }
    renderTheme();
  }

  function hideEyeCareHint() {
    if (!eyeCareHint) return;
    window.clearTimeout(eyeCareTimer);
    eyeCareTimer = 0;
    eyeCareHint.classList.remove('is-visible');
  }

  function showEyeCareHint(event) {
    if (!eyeCareHint) return;
    eyeCareHint.textContent = '夜间已切到白天模式，注意用眼休息。';
    eyeCareHint.classList.remove('is-visible');

    const compact = window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
    if (compact) {
      eyeCareHint.classList.add('is-mobile');
      eyeCareHint.style.left = '';
      eyeCareHint.style.top = '';
    } else {
      eyeCareHint.classList.remove('is-mobile');
      const buttonRect = themeToggle ? themeToggle.getBoundingClientRect() : null;
      const hasPointer = event && event.detail > 0;
      const fallbackX = buttonRect
        ? buttonRect.left + buttonRect.width / 2
        : window.innerWidth - 16;
      const fallbackY = buttonRect ? buttonRect.bottom : 16;
      const anchorX = hasPointer ? event.clientX : fallbackX;
      const anchorY = hasPointer ? event.clientY : fallbackY;
      const hintRect = eyeCareHint.getBoundingClientRect();
      const left = clamp(anchorX + 14, 12, window.innerWidth - hintRect.width - 12);
      const top = clamp(anchorY + 16, 12, window.innerHeight - hintRect.height - 12);
      eyeCareHint.style.left = `${left}px`;
      eyeCareHint.style.top = `${top}px`;
    }

    window.requestAnimationFrame(() => eyeCareHint.classList.add('is-visible'));
    window.clearTimeout(eyeCareTimer);
    eyeCareTimer = window.setTimeout(() => {
      eyeCareHint.classList.remove('is-visible');
    }, 3200);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', (event) => {
      closeMobileNav();
      const next = resolveTheme(themeMode) === 'dark' ? 'light' : 'dark';
      setThemeMode(next);
      if (next === 'light' && isNightTime() && root.dataset.theme === 'light') {
        showEyeCareHint(event);
      } else {
        hideEyeCareHint();
      }
    });
  }

  renderTheme();
  window.setInterval(() => {
    if (themeMode === 'auto') renderTheme();
  }, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && themeMode === 'auto') renderTheme();
  });

  /* Mobile navigation -------------------------------------------------- */

  const navToggle = $('#nav-toggle');
  const mobilePanel = $('#mobile-panel');

  function closeMobileNav() {
    if (!navToggle || !mobilePanel) return;
    mobilePanel.hidden = true;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '打开菜单');
  }

  if (navToggle && mobilePanel) {
    navToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = mobilePanel.hidden;
      if (willOpen) {
        hideEyeCareHint();
        mobilePanel.hidden = false;
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', '关闭菜单');
      } else {
        closeMobileNav();
      }
    });

    mobilePanel.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMobileNav();
    });
  }

  document.addEventListener('click', () => {
    closeMobileNav();
  });

  window.addEventListener('resize', () => {
    hideEyeCareHint();
    if (window.innerWidth > 900) closeMobileNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileNav();
    }
  });

  /* Header state and scroll utilities ---------------------------------- */

  const header = $('.site-header');
  const toTop = $('#to-top');

  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 520);
  }

  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
      });
    });
  }

  /* Search ------------------------------------------------------------- */

  const searchDialog = $('#search-dialog');
  const searchOpenButton = $('#search-open');
  const searchInput = $('#search-input');
  const searchResults = $('#search-results');
  const searchCloseButton = $('[data-search-close]');
  let searchIndex = null;
  let searchLoading = false;
  let searchFailed = false;
  let activeResult = -1;

  const searchKeyboardHint = $('.search-trigger-kbd');
  if (searchKeyboardHint && /Mac|iPhone|iPad/i.test(navigator.platform)) {
    searchKeyboardHint.textContent = '⌘K';
  }

  function searchUrl() {
    return `${basePath}search.json`;
  }

  async function ensureSearchIndex() {
    if (searchIndex || searchLoading) return;
    searchLoading = true;
    searchResults.innerHTML = '<p class="search-loading">正在载入搜索索引…</p>';
    try {
      const response = await fetch(searchUrl(), { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      searchIndex = await response.json();
      searchFailed = false;
    } catch {
      searchFailed = true;
      searchIndex = [];
      searchResults.innerHTML =
        '<p class="search-empty">搜索索引加载失败，请刷新页面后重试。</p>';
    } finally {
      searchLoading = false;
    }
  }

  function popularTags(limit = 8) {
    const counts = new Map();
    for (const post of searchIndex || []) {
      for (const tag of post.tags || []) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  function renderSearchHome() {
    if (!searchResults) return;
    if (searchFailed) return;
    const tags = popularTags();
    searchResults.innerHTML = `<div class="search-popular">
      <p class="search-popular-label">热门标签</p>
      <div class="search-popular-tags">
        ${tags
          .map(
            (tag) =>
              `<button class="search-popular-tag" type="button" data-search-tag="${escapeHtml(
                tag,
              )}">${escapeHtml(tag)}</button>`,
          )
          .join('')}
      </div>
    </div>`;
    activeResult = -1;
  }

  function scorePost(post, tokens) {
    const title = post.title.toLowerCase();
    const tags = (post.tags || []).join(' ').toLowerCase();
    const category = (post.category || '').toLowerCase();
    const text = (post.text || '').toLowerCase();
    let score = 0;

    for (const token of tokens) {
      let tokenScore = 0;
      if (title.includes(token)) tokenScore += 8;
      if (tags.includes(token)) tokenScore += 4;
      if (category.includes(token)) tokenScore += 2;
      if (text.includes(token)) tokenScore += 1;
      if (!tokenScore) return 0;
      score += tokenScore;
    }

    return score;
  }

  function makeSnippet(text, tokens) {
    if (!text) return '';
    const lower = text.toLowerCase();
    let bestIndex = -1;
    for (const token of tokens) {
      const index = lower.indexOf(token);
      if (index !== -1 && (bestIndex === -1 || index < bestIndex)) bestIndex = index;
    }
    const start = bestIndex > 46 ? bestIndex - 46 : 0;
    const end = Math.min(text.length, start + 150);
    return `${start > 0 ? '…' : ''}${text.slice(start, end)}${
      end < text.length ? '…' : ''
    }`;
  }

  function markMatches(text, tokens) {
    const validTokens = [...new Set(tokens.filter(Boolean))].sort(
      (a, b) => b.length - a.length,
    );
    if (!validTokens.length) return escapeHtml(text);
    const pattern = new RegExp(`(${validTokens.map(escapeRegExp).join('|')})`, 'gi');
    let result = '';
    let lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      result += escapeHtml(text.slice(lastIndex, match.index));
      result += `<mark>${escapeHtml(match[0])}</mark>`;
      lastIndex = match.index + match[0].length;
    }
    result += escapeHtml(text.slice(lastIndex));
    return result;
  }

  function updateActiveResult(nextIndex) {
    const results = $$('.search-result', searchResults);
    if (!results.length) return;
    activeResult = (nextIndex + results.length) % results.length;
    results.forEach((result, index) => {
      result.classList.toggle('is-active', index === activeResult);
    });
    results[activeResult].scrollIntoView({ block: 'nearest' });
  }

  function renderSearchResults() {
    if (!searchResults || !searchIndex) return;
    const query = searchInput.value.trim();
    if (!query) {
      renderSearchHome();
      return;
    }

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = searchIndex
      .map((post) => ({ post, score: scorePost(post, tokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
      .slice(0, 8);

    activeResult = -1;

    if (!matches.length) {
      searchResults.innerHTML = `<p class="search-empty">没有找到「${escapeHtml(
        query,
      )}」相关内容，换个关键词试试。</p>`;
      return;
    }

    searchResults.innerHTML = matches
      .map(({ post }, index) => {
        const snippet = makeSnippet(post.text || post.description || '', tokens);
        const meta = [post.category, ...(post.tags || [])].filter(Boolean).join(' · ');
        return `<a class="search-result" href="${post.url}" data-result-index="${index}">
          <div class="search-result-top">
            <span class="search-result-title">${markMatches(post.title, tokens)}</span>
            <time>${escapeHtml(post.date)}</time>
          </div>
          <p class="search-result-snippet">${markMatches(snippet, tokens)}</p>
          <p class="search-result-meta">${escapeHtml(meta)}</p>
        </a>`;
      })
      .join('');
  }

  async function openSearch() {
    if (!searchDialog) return;
    hideEyeCareHint();
    closeMobileNav();
    if (!searchDialog.open) searchDialog.showModal();
    searchInput.value = '';
    activeResult = -1;
    searchInput.focus();
    await ensureSearchIndex();
    if (!searchInput.value.trim()) renderSearchHome();
  }

  if (searchDialog && searchOpenButton && searchInput && searchResults) {
    searchOpenButton.addEventListener('click', openSearch);

    searchCloseButton?.addEventListener('click', () => searchDialog.close());

    searchDialog.addEventListener('click', (event) => {
      if (event.target === searchDialog) searchDialog.close();
    });

    searchInput.addEventListener('input', renderSearchResults);

    searchInput.addEventListener('keydown', (event) => {
      const results = $$('.search-result', searchResults);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        updateActiveResult(activeResult < 0 ? 0 : activeResult + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        updateActiveResult(activeResult < 0 ? results.length - 1 : activeResult - 1);
      } else if (event.key === 'Enter') {
        const target =
          results[activeResult >= 0 ? activeResult : 0] || null;
        if (target) {
          event.preventDefault();
          window.location.href = target.href;
        }
      }
    });

    searchResults.addEventListener('click', (event) => {
      const tagButton = event.target.closest('[data-search-tag]');
      if (tagButton) {
        searchInput.value = tagButton.dataset.searchTag;
        renderSearchResults();
        searchInput.focus();
      }
    });

    searchDialog.addEventListener('close', () => {
      activeResult = -1;
    });

    document.addEventListener('keydown', (event) => {
      const isShortcut =
        (event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey);
      const isSlash =
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') &&
        !document.activeElement?.isContentEditable;

      if (isShortcut || isSlash) {
        event.preventDefault();
        openSearch();
      }
    });
  }

  /* Code blocks and tables --------------------------------------------- */

  const LANGUAGE_LABELS = {
    shell: 'Shell',
    bash: 'Bash',
    sh: 'Shell',
    zsh: 'Shell',
    console: 'Shell',
    powershell: 'PowerShell',
    ps1: 'PowerShell',
    cmd: 'CMD',
    bat: 'Batch',
    python: 'Python',
    py: 'Python',
    javascript: 'JavaScript',
    js: 'JavaScript',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    xml: 'XML',
    html: 'HTML',
    css: 'CSS',
    markdown: 'Markdown',
    md: 'Markdown',
    dockerfile: 'Dockerfile',
    nginx: 'Nginx',
    sql: 'SQL',
    c: 'C',
    cpp: 'C++',
    go: 'Go',
    rust: 'Rust',
    ini: 'INI',
    text: 'Text',
    plaintext: 'Text',
  };

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      let success = false;
      try {
        success = document.execCommand('copy');
      } catch {
        success = false;
      }
      textarea.remove();
      return success;
    }
  }

  function enhanceCodeBlocks() {
    for (const code of $$('.post-prose pre > code')) {
      const pre = code.parentElement;
      if (!pre || pre.closest('.code-block')) continue;
      const languageMatch = code.className.match(/language-([\w-]+)/);
      const language = languageMatch ? languageMatch[1].toLowerCase() : '';
      const label = LANGUAGE_LABELS[language] || (language ? language : 'Code');

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const bar = document.createElement('div');
      bar.className = 'code-bar';
      bar.innerHTML = `<span>${escapeHtml(label)}</span><button class="code-copy" type="button">复制</button>`;
      wrapper.insertBefore(bar, pre);

      const button = $('.code-copy', bar);
      let resetTimer = 0;
      button.addEventListener('click', async () => {
        const copied = await copyText(code.textContent);
        button.textContent = copied ? '已复制' : '复制失败';
        button.classList.toggle('is-copied', copied);
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          button.textContent = '复制';
          button.classList.remove('is-copied');
        }, 1600);
      });
    }
  }

  function enhanceTables() {
    for (const table of $$('.post-prose table')) {
      if (table.parentElement?.classList.contains('table-wrap')) continue;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrap';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  }

  /* Lightbox ----------------------------------------------------------- */

  function setupLightbox() {
    const lightbox = $('#lightbox');
    if (!lightbox) return;
    const lightboxImage = $('img', lightbox);
    const caption = $('figcaption', lightbox);
    const closeButton = $('.lightbox-close', lightbox);

    function openLightbox(image) {
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt || '';
      caption.textContent = image.alt || '';
      caption.hidden = !image.alt;
      lightbox.showModal();
    }

    for (const image of $$('.post-prose img')) {
      if (image.closest('a')) continue;
      image.setAttribute('role', 'button');
      image.setAttribute('tabindex', '0');
      image.setAttribute('aria-label', `查看大图${image.alt ? `：${image.alt}` : ''}`);
      image.addEventListener('click', () => openLightbox(image));
      image.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(image);
        }
      });
    }

    closeButton?.addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) lightbox.close();
    });
  }

  /* Table of contents and reading progress ----------------------------- */

  function setupArticle() {
    const article = $('.post-prose');
    const progressBar = $('#reading-progress-bar');
    const tocLinks = $$('.toc-list a');
    const tocTargets = new Map();

    for (const link of tocLinks) {
      const id = decodeURIComponent((link.getAttribute('href') || '').slice(1));
      const target = document.getElementById(id);
      if (target) tocTargets.set(id, target);
    }

    const orderedTargets = [...tocTargets.entries()].sort(
      (a, b) => a[1].offsetTop - b[1].offsetTop,
    );

    function updateArticle() {
      if (article && progressBar) {
        const rect = article.getBoundingClientRect();
        const start = rect.top + window.scrollY - window.innerHeight * 0.2;
        const end = rect.bottom + window.scrollY - window.innerHeight;
        const ratio = end > start ? (window.scrollY - start) / (end - start) : 0;
        progressBar.style.width = `${clamp(ratio, 0, 1) * 100}%`;
      }

      if (orderedTargets.length) {
        let currentId = '';
        for (const [id, target] of orderedTargets) {
          if (target.getBoundingClientRect().top <= 132) {
            currentId = id;
          } else {
            break;
          }
        }
        for (const link of tocLinks) {
          const id = decodeURIComponent((link.getAttribute('href') || '').slice(1));
          link.classList.toggle('is-active', id === currentId);
        }
      }
    }

    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(() => {
            updateHeader();
            updateArticle();
            ticking = false;
          });
        }
      },
      { passive: true },
    );
    window.addEventListener('resize', updateArticle);
    updateHeader();
    updateArticle();
  }

  /* Init --------------------------------------------------------------- */

  enhanceCodeBlocks();
  enhanceTables();
  setupLightbox();
  setupArticle();
  updateHeader();
})();
