import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://jesse-plcx.github.io',
  output: 'static',
  publicDir: './static',
  trailingSlash: 'always',
  compressHTML: true,
  redirects: {
    '/page/2/': '/archives/', '/archives/page/2/': '/archives/',
    '/categories/-Study/': '/categories/Study/',
  },
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: 'ignore', throwOnError: true }]],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' }, wrap: false,
      langAlias: { pythonpython: 'python', gitignore: 'text' },
    },
  },
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4321 },
});
