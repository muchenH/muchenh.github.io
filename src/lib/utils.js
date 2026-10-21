import site from '../../site.config.js';

const ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  middot: '·',
};

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function decodeEntities(value = '') {
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, name) => {
    if (name[0] === '#') {
      const code =
        name[1].toLowerCase() === 'x'
          ? Number.parseInt(name.slice(2), 16)
          : Number.parseInt(name.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITY_MAP[name.toLowerCase()] ?? match;
  });
}

export function stripHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function plainText(html = '') {
  return decodeEntities(stripHtml(html));
}

export function truncate(value, length = 120) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

export function normalizeBase(base) {
  let value = String(base || '/').trim();
  if (!value.startsWith('/')) value = `/${value}`;
  if (!value.endsWith('/')) value = `${value}/`;
  return value.replace(/\/{2,}/g, '/');
}

export function withBase(path = '/') {
  const base = normalizeBase(site.basePath);
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:')) {
    return path;
  }
  const clean = path.replace(/^\/+/, '');
  return clean ? `${base}${clean}` : base;
}

export function absoluteUrl(path = '/') {
  const base = new URL(site.url);
  const root = normalizeBase(site.basePath);
  const clean = path.replace(/^\/+/, '');
  const url = new URL(`${root}${clean}`.replace(/\/{2,}/g, '/'), base);
  return url.href;
}

export function dateParts(date = {}) {
  return {
    year: date.year || '1970',
    month: date.month || '01',
    day: date.day || '01',
    time: date.time || '00:00',
  };
}

export function formatDisplayDate(date) {
  const { year, month, day } = dateParts(date);
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

export function formatShortDate(date) {
  const { year, month, day } = dateParts(date);
  return `${year}.${month}.${day}`;
}

export function formatArchiveDate(date) {
  const { month, day } = dateParts(date);
  return `${month}.${day}`;
}

export function toDateTime(date) {
  const { year, month, day, time } = dateParts(date);
  return `${year}-${month}-${day}T${time}:00${site.timezone}`;
}

export function toRfc822(date) {
  const { year, month, day, time } = dateParts(date);
  return new Date(`${year}-${month}-${day}T${time}:00${site.timezone}`).toUTCString();
}

export function readingTime(text) {
  const cjk = (String(text).match(/[\u3400-\u9fff\u3040-\u30ff]/g) || []).length;
  const latin = (String(text).replace(/[\u3400-\u9fff\u3040-\u30ff]/g, ' ').match(/[A-Za-z0-9_]+/g) || [])
    .length;
  const minutes = Math.max(1, Math.round(cjk / 320 + latin / 220));
  return `约 ${minutes} 分钟`;
}

export function hashHue(value = '') {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return 110 + (hash % 80);
}

export function slugifyHeading(text, used = new Map()) {
  let slug = decodeEntities(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/[\s\u3000]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}\-_]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) slug = 'section';
  const count = used.get(slug) || 0;
  used.set(slug, count + 1);
  return count === 0 ? slug : `${slug}-${count + 1}`;
}

export function slugifyTerm(value) {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'item';
}

export function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function chunk(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}
