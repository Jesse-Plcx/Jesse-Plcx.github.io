import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts, postPath, summary } from '../lib/posts';
import { site } from '../config';
export const GET: APIRoute = async () => rss({
  title: site.title, description: site.description, site: site.url,
  items: (await getPosts()).map(post => ({
    title: post.data.title, pubDate: post.data.date, description: summary(post),
    link: postPath(post), categories: post.data.categories,
  })),
  customData: '<language>zh-CN</language>',
});
