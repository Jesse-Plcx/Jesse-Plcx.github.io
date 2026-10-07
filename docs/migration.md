# 个人博客方案与迁移说明

## 选择：Astro + Markdown + GitHub Pages

不存在对所有人通用的“最好框架”。这个项目的目标是个人写作：技术、论文笔记、兴趣与日常均可，既要有自己的主页风格，也要方便长期维护。

| 方案 | 适用场景 | 本项目的判断 |
| --- | --- | --- |
| Astro | 以内容为主，保留前端设计和交互扩展空间 | 采用；静态页面、Markdown 内容集合、独立组件适合这次迁移 |
| Hugo | 希望使用一个静态生成工具，减少 JavaScript 依赖 | 很好的备选；若更重视工具简洁，可以优先考虑 |
| VitePress | 系统化的技术文档、教程和知识库 | 适合文档导航；当前内容以随手写作为主，选择博客布局更合适 |
| 原 Hexo | 延续现有文章与成熟主题配置 | 仍可使用；本次希望改变主页风格，因此迁移 |

上表是针对当前需求的取舍，不是速度或流行度排名。

## 组成

- Astro 7：静态生成、组件布局、内容集合与 TypeScript。
- Markdown：沿用 source/_posts 作为唯一公开文章来源，私人目录完全不加载。
- Unified + remark-math + rehype-katex：兼容现有 Markdown 与数学公式。
- Shiki：代码高亮；浅色和深色模式均支持。
- Pagefind：构建后的中文全文搜索；默认扩展版本支持中文分词。
- sitemap：正确站点地址与搜索引擎索引。
- GitHub Actions + GitHub Pages：源码留在 main，生成页面通过发布产物上传，避免静态文件覆盖源码分支。
- Node.js 24 LTS：本地、CI、Docker 使用同一个主版本。

搜索页在开发环境可以退回公开文章 JSON 索引。发布环境优先使用 Pagefind。两种索引都由同一批公开文章生成，草稿和未来文章不会进入列表、路由或搜索索引。

## 迁移行为

- 保留现有 13 篇公开文章的内容、日期和原 /年/月/日/文件名/ 网址。
- 保留分类与标签的网址（包括大小写）。
- 兼容原有年份和月份归档；旧分页入口转到全部文章。
- 图片移入静态资源目录后，原 /p_imgs/ 引用不变。
- 没有将私人笔记导入新项目，也不会将它们复制到发布目录。
- 站点 canonical 改为真实的 https://jesse-plcx.github.io。
- 新主页采用网格、编号、几何索引面板和绿色强调色；正文优先保证阅读。
- 删除旧 Hexo 构建与 deploy 命令，避免误用两套发布路径。
- 原主题、配置、依赖清单、说明文件等在本地 backup_from_merge/hexo-before-astro-2026-10-07 备份。

公开仓库里的文件本身是公开的。draft 标记只防止网站展示，不能把已提交的 Markdown 变为私人内容。

## 校验

npm run check 校验 Astro 与 TypeScript。
npm run build 构建全部静态页面、公式和 Pagefind 索引。
npm run verify 校验旧文章路径、内部链接、资源、canonical、数学渲染和搜索索引，检查发布目录没有私人路径或密钥文件。

Docker 方案已更新，但需要本机运行 Docker 引擎才能验证镜像构建。

## 官方资料

- [Astro 内容集合](https://docs.astro.build/en/guides/content-collections/)
- [Astro Markdown 与 Unified](https://docs.astro.build/en/guides/markdown-content/)
- [Astro 发布到 GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
- [Pagefind 中文搜索](https://pagefind.app/docs/multilingual/)
- [GitHub Pages 是什么](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Hugo 入门](https://gohugo.io/getting-started/quick-start/)
- [VitePress 定位](https://vitepress.dev/guide/what-is-vitepress)
