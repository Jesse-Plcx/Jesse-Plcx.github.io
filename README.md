# Jesse's Blog

一个有技术感、适合中文阅读的个人日志。使用 Astro 静态生成，Markdown 写作，GitHub Pages 自动发布。

## 本地运行

需要 **Node.js 24 LTS**（项目有 `.nvmrc` 和 `.node-version`）。

```powershell
npm ci
npm run dev
```

访问终端显示的地址，通常是 http://localhost:4321/ 。`npm run server` 也可以启动预览。

```powershell
npm run check
npm run build
npm run verify
npm run preview
```

`build` 会生成页面和中文全文搜索索引。开发预览的搜索会自动使用公开文章索引。

## 写一篇文章

公开文章仍在 **source/_posts/**，原来的 13 篇文章不用重写。原日期与文件名组成的网址保持不变。

```powershell
npm run new -- "今天折腾了一点东西"
```

命令会创建一个带 `draft: true` 的 Markdown 文件，而且不会覆盖已有文件。

```yaml
---
title: 今天折腾了一点东西
date: 2026-10-07
description: 用一句话介绍这篇文章，可留空
tags:
  - 技术
categories:
  - Study
draft: false
---
```

- `date` 是文章日期，决定默认网址。
- `updated` 可选，只有你填写后才显示修订日期。
- `description` 可选，留空时从正文提取摘要。
- `tags` 和 `categories` 可以按自己的习惯填写。现有 Study / Research / Interest / Life 会显示为中文。
- `draft: true` 或未来日期不会发布到网站；`draft: false` 后可以本地预览正文。
- `permalink` 可选，指定固定路径，如 `2026/10/07/my-note`。发布后尽量保持文件名、日期或 permalink 稳定。

**草稿标记只控制网站是否展示，不控制 GitHub 仓库可见性。** 向公开仓库提交的草稿文件依然可以被查看。需要保密的草稿、私人笔记放在 **source/_private_posts/**；该目录不被加载、不被 Git 跟踪，也不进入 Docker 构建。

图片放在 `static/p_imgs/`，正文引用 `![说明](/p_imgs/example.png)`。

行内公式使用 `$ E = mc^2 $`，独立公式使用 `$$ ... $$`。KaTeX 在构建时渲染，字体和样式跟随网站发布。代码块会自动高亮，并带复制按钮。

## 更新 GitHub 上的网站

现有仓库是 [Jesse-Plcx/Jesse-Plcx.github.io](https://github.com/Jesse-Plcx/Jesse-Plcx.github.io)，网站地址是 https://jesse-plcx.github.io/ 。

1. 在 GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 本地写作、预览，然后运行 `npm run check`、`npm run build`、`npm run verify`。
3. 检查变更，提交并推送公开文章、图片和项目源码到 `main`。
4. 仓库的 Actions 自动安装依赖、生成页面与搜索索引、校验并发布网站。

例如：

```powershell
git status
git add src static scripts source/_posts .github astro.config.mjs package.json package-lock.json README.md docs .gitignore .dockerignore .nvmrc .node-version tsconfig.json Dockerfile nginx.conf start.ps1 .gitattributes
git add -u
git diff --cached --stat
git commit -m "Migrate personal blog to Astro"
git push origin main
```

迁移之后的日常更新，只需提交相应的文章和图片。**不需要提交 dist、node_modules 或原来的 public，也不需要手动推送生成的 HTML。** 私人内容和密钥不要放进公开文章或静态资源目录。

GitHub 是代码托管与网站发布平台，Astro 是生成博客的框架，两者独立。如果以后更换托管平台，把 `dist/` 部署到支持静态网站的平台即可。

## 目录

```text
source/_posts/           公开 Markdown 文章
source/_private_posts/   私人笔记，仅本地、不会构建
static/                 图片、favicon、robots.txt
src/content.config.ts   公开内容加载与校验
src/config.ts           名称、简介、作者、话题显示名称
src/pages/              首页、文章、归档、标签、搜索
src/components/         列表、导航图标等组件
src/layouts/            公共布局与阅读布局
src/styles/global.css   视觉与移动端排版
scripts/                新建文章与构建验证
.github/workflows/      GitHub Pages 自动发布
dist/                   构建结果，Git 忽略
backup_from_merge/      本地历史备份，Git 忽略
```

主页个人介绍和兴趣标签统一在 `src/config.ts` 的 `profile` 中修改。其他个人信息与文案主要改 `src/config.ts`、`src/pages/index.astro`、`src/pages/about.astro`。更换域名时同步更新 `astro.config.mjs`、`src/config.ts`、`static/robots.txt`；自定义域名还需配置 `static/CNAME`。

## Docker（可选）

```powershell
docker build -t jesse-blog .
docker run --rm -p 4000:80 jesse-blog
```

访问 http://localhost:4000/ 。Docker 只是另一种本地或服务器部署方式，GitHub Pages 不需要 Docker。

旧 Hexo 的主题、配置、依赖清单和首页已备份至 `backup_from_merge/hexo-before-astro-2026-10-07/`；旧文章正文保持不变。详情见 [迁移方案](docs/migration.md)。

## 在当前 Windows 机器上启动

系统 Node 仍是旧版本时，可以运行项目中的 `.\start.ps1`。它优先使用系统 Node 24；否则使用当前 Codex 已有的 Node 24，只修改当前进程的 PATH，不改变系统安装。常规开发仍建议把系统环境切到 Node 24 LTS。

`npm run test:publication` 会用临时草稿和未来文章验证发布排除，再恢复正常构建；测试不改已有文章。

## 历史隐私与旧副本

这个项目的旧历史曾包含私人文章。发布新版本时会清理旧 Markdown 和包含它们的生成页面；GitHub 的旧 PR 引用及缓存视图还需要平台支持处理。

如果你在其他机器上有迁移前的仓库副本，请重新 clone 清理后的仓库，不要把旧分支或旧历史合并、推送回来。本机的历史 bundle、私人文件和备份都保存在 Git 忽略目录中，仅用于本地恢复，不要上传。

## 私密文档专区

网站的 `/private/` 提供强口令解锁。文档在本机先加密，仅上传密文；首次设置请运行 `.\protect-private.ps1`。配置和安全边界见 [私密专区说明](docs/private-vault.md)。
