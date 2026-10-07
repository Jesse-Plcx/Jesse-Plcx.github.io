import type { APIRoute } from 'astro';
import { getPosts, postPath, summary, plainText } from '../lib/posts';
export const GET: APIRoute = async () => new Response(JSON.stringify(
  (await getPosts()).map(post => ({
    title: post.data.title, url: postPath(post), excerpt: summary(post),
    text: plainText(post.body ?? ''),
  })),
), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
