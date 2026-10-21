const siteConfig = {
  title: 'muchenH Blog',
  tagline: '佛系摸鱼中',
  description:
    'muchenH 的个人博客，记录 Linux、Docker、Windows、Python 与代码的实践笔记。',
  author: 'muchenH',
  lang: 'zh-CN',

  // 自定义域名。部署到 GitHub Pages 的「项目站点」（/repo-name/）时，
  // 请把 basePath 改成 '/repo-name/'，cname 会自动停用。
  url: process.env.SITE_URL || 'https://blog.muyc.site',
  basePath: process.env.BASE_PATH || '/',
  cname: 'blog.muyc.site',
  timezone: '+08:00',

  github: 'https://github.com/muchenH',
  since: 2021,

  hero: {
    eyebrow: 'muchenH · 佛系摸鱼中',
    titleLead: '把折腾过的，',
    titleAccent: '都写下来。',
    description:
      'Linux、Docker、Windows 与代码的实践笔记。踩过的坑、查过的资料，还有偶尔冒出来的想法，都慢慢整理在这里。',
    quote: '再长的路，一步步也能走完。',
  },

  footerNote: '佛系摸鱼中，偶尔写点有用的。',

  // 「跟随时间」模式的深色时段：19:00 到次日 07:00。
  theme: {
    autoDarkStart: 19,
    autoDarkEnd: 7,
  },

  navigation: [
    { label: '首页', path: '/', key: 'home' },
    { label: '归档', path: '/archives/', key: 'archives' },
    { label: '分类', path: '/categories/', key: 'categories' },
    { label: '标签', path: '/tags/', key: 'tags' },
    { label: '关于', path: '/about/', key: 'about' },
  ],

  feedLimit: 20,
  homePostLimit: 10,
};

// 项目站点不要带自定义域名；需要时可用 CNAME 环境变量覆盖。
if (siteConfig.basePath !== '/') {
  siteConfig.cname = '';
}
if (process.env.CNAME !== undefined) {
  siteConfig.cname = process.env.CNAME;
}

export default siteConfig;
