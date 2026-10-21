import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import site from '../../site.config.js';
import {
  decodeEntities,
  escapeHtml,
  normalizeBase,
  slugifyHeading,
  stripHtml,
  truncate,
  withBase,
} from './utils.js';

const languageAliases = {
  sh: 'bash',
  zsh: 'bash',
  shell: 'bash',
  console: 'bash',
  ps1: 'powershell',
  yml: 'yaml',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  md: 'markdown',
  html: 'xml',
};

const siteHost = new URL(site.url).host;
let headingIds = new Map();
let currentPostPath = '/';

const marked = new Marked({ gfm: true, breaks: false });
marked.use(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const requested = String(lang || '').trim().split(/\s+/)[0].toLowerCase();
      const language = languageAliases[requested] || requested;
      const resolved = language && hljs.getLanguage(language) ? language : 'plaintext';
      try {
        return hljs.highlight(code, { language: resolved, ignoreIllegals: true }).value;
      } catch {
        return escapeHtml(code);
      }
    },
  }),
);

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      const text = decodeEntities(stripHtml(inner));
      const id = slugifyHeading(text, headingIds);
      const level = depth === 1 ? 2 : depth;
      return `<h${level} id="${escapeHtml(id)}">${inner}<a class="heading-anchor" href="#${escapeHtml(
        id,
      )}" aria-hidden="true" tabindex="-1">#</a></h${level}>\n`;
    },

    image({ href, title, text }) {
      let alt = text || '';
      let width = null;
      const widthMatch = alt.match(/^(.*)-w(\d+)$/);
      if (widthMatch) {
        alt = widthMatch[1];
        width = Number(widthMatch[2]);
      }
      const source = normalizeAssetUrl(href);
      const style = width && width > 0 ? ` style="max-width:${width}px"` : '';
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<img src="${escapeHtml(source)}" alt="${escapeHtml(
        alt,
      )}"${titleAttr} loading="lazy" decoding="async"${style}>`;
    },

    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      if (!href) return text;

      let target = href;
      let external = false;

      if (/^https?:\/\//i.test(href)) {
        try {
          const parsed = new URL(href);
          if (parsed.host === siteHost) {
            target = `${parsed.pathname}${parsed.search}${parsed.hash}`;
          } else {
            external = true;
          }
        } catch {
          external = true;
        }
      } else if (href.startsWith('//')) {
        external = true;
      } else if (!href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        if (href.startsWith('/')) {
          target = href;
        } else {
          const resolved = new URL(href, absolutePostUrl());
          target = `${resolved.pathname}${resolved.search}${resolved.hash}`;
        }
      }

      if (!external && target.startsWith('/') && !target.startsWith(normalizeBase(site.basePath))) {
        target = withBase(target);
      }

      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const externalAttr = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escapeHtml(target)}"${titleAttr}${externalAttr}>${text}</a>`;
    },
  },
});

function absolutePostUrl() {
  const base = normalizeBase(site.basePath);
  const clean = currentPostPath.replace(/^\/+/, '');
  return new URL(`${base}${clean}`, site.url).href;
}

function normalizeAssetUrl(href) {
  if (!href || /^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith('data:')) {
    return href;
  }

  const normalized = String(href).replace(/\\/g, '/');
  const mediaIndex = normalized.indexOf('media/');
  if (mediaIndex >= 0) {
    return withBase(`/${normalized.slice(mediaIndex)}`);
  }
  if (normalized.startsWith('/')) {
    return withBase(normalized);
  }
  return normalized;
}

function postProcessAssets(html) {
  return html.replace(/\ssrc="([^"]+)"/g, (match, source) => {
    if (/^(?:[a-z]+:)?\/\//i.test(source) || source.startsWith('data:')) return match;
    const normalized = source.replace(/\\/g, '/');
    const mediaIndex = normalized.indexOf('media/');
    if (mediaIndex >= 0) {
      return ` src="${withBase(`/${normalized.slice(mediaIndex)}`)}"`;
    }
    return match;
  });
}

function extractHeadings(html) {
  const headingPattern = /<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  const headings = [];
  for (const match of html.matchAll(headingPattern)) {
    const text = decodeEntities(
      stripHtml(match[3].replace(/<a class="heading-anchor"[\s\S]*?<\/a>/g, '')),
    );
    if (text) {
      headings.push({ depth: Number(match[1]), id: match[2], text });
    }
  }
  return headings;
}

export function renderMarkdown(raw, postPath = '/') {
  headingIds = new Map();
  currentPostPath = postPath;
  const html = postProcessAssets(marked.parse(raw));
  return {
    html,
    headings: extractHeadings(html),
    text: stripHtml(html).replace(/\s+/g, ' ').trim(),
  };
}

export function makeExcerpt(html, fallback = '') {
  const paragraphPattern = /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i;
  const match = html.match(paragraphPattern);
  if (!match) return truncate(fallback, 100);
  const text = decodeEntities(stripHtml(match[1]));
  if (!text || text.length < 8) return truncate(fallback, 100);
  return truncate(text, 110);
}
