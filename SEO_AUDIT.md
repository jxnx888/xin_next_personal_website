# SEO 追踪清单

创建于 2026-08-07。记录 SEO 审查发现的问题,完成一项就把 `[ ]` 改成 `[x]`。

---

## 🔴 高优先级

- [x] **Sitemap 漏掉纯中文文章** — `app/sitemap.ts`。已改为分别取 en/zh 两份列表再拼接对应 locale 的 URL。已跑 lint + tsc 确认无误。

- [x] **`public/index.html` 是老站点遗留的死页面** — 已确认没在用 Bing Webmaster Tools,直接删除。

- [x] **博客 JSON-LD 结构化数据不完整** — `app/[locale]/blog/[id]/page.tsx`。已补 `datePublished`、`dateModified`、`image`、`publisher`、`mainEntityOfPage`。

- [x] **博客 OpenGraph 缺 `publishedTime`/`authors`** — 已补上,值取自 `blog.time`。

---

## 🟡 中优先级

- [x] **图片 alt 文本为空**
  - `components/blog/BlogCard.tsx` 文章缩略图:已改为 `t('BLOG_COVER_ALT', { tag })`,新增翻译键 `BLOG_COVER_ALT`(en/zh 都已加)。
  - `components/layout/Footer.tsx` 社交图标:检查后发现图标已包在带 `aria-label` 的链接里(如"Visit LinkedIn profile..."),`alt=""` 是正确的无障碍写法,避免重复朗读 —— **不用改**。

- [x] **`app/manifest.ts` 图标不全** — 用项目里已有的 `sharp` 把 `logo.png`(横向毛笔字 wordmark)以 contain 方式(不裁剪、不切字)合成到方形画布上,生成了:
  - `public/icon-192.png`、`public/icon-512.png` — 透明背景,接入 `manifest.ts` 的 `icons` 数组
  - `public/apple-touch-icon.png`(180×180,白底,iOS 不支持透明背景)— 接入 `app/[locale]/layout.tsx` 的 `metadata.icons`
  - 同时把博客 JSON-LD 的 `publisher.logo` 从非方形 `logo.png` 换成了新生成的方形 `icon-512.png`

- [x] **域名 fallback 不统一** — 四个文件(`page.tsx`、`blog/[id]/page.tsx`、`sitemap.ts`、`robots.ts`)的兜底域名已统一成 `https://www.ning-xin.com`,和 `.env.example` 一致。

---

## 🟢 低优先级

- [x] `<html lang={locale}>` — 已改为中文时输出 `"zh-CN"`,和 og:locale/schema 保持一致(`app/[locale]/layout.tsx`)。
- [x] 除博客文章外,其他页面共用同一张 OG 图 `banner1.png` — 已给 `projects`(`banner2.png`)、`blog` 列表(`banner3.png`)各自定制;`contact`/`resume` 没有专属 banner 素材,保留默认。
- [x] 没有 `BreadcrumbList` 结构化数据 — 已在博客详情页加上 `Home > Blog > 文章标题` 的 `BreadcrumbList`(`app/[locale]/blog/[id]/page.tsx`)。

---

## 已确认没问题,不用动

- canonical + hreflang 全站点都配了
- `/blog` 的标签筛选/搜索用 query 参数,但 canonical 始终指向干净 URL,无重复内容风险
- CSP / HSTS 等安全头已配置
- 博客文章已有动态 OG 图(`opengraph-image.tsx`)
- sitemap / robots 基础设施都在

---

## 需要用户自己做的事(代码之外)

- [ ] 去 Google Search Console 提交 `/sitemap.xml`,检查覆盖率报告
- [ ] 去百度站长平台 / 必应网站管理员工具单独提交(Google Search Console 的验证对百度无效)
- [ ] 持续产出高质量原创博客内容(目前影响最大的杠杆)
- [ ] 补充 `sameAs` 外链(GitHub、掘金、Twitter/X 等,如果有)
- [ ] 审阅图片 alt 文本的具体措辞
