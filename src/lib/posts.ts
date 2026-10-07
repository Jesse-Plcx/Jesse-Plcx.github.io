import { getCollection, type CollectionEntry } from 'astro:content';
export type Post = CollectionEntry<'posts'>;

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft && data.date.getTime() <= Date.now());
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}
export function dateKey(date: Date): string { return date.toISOString().slice(0, 10); }
export function formatDate(date: Date): string { return dateKey(date).replaceAll('-', '.'); }

export function postPath(post: Post): string {
  const path = post.data.permalink ?? `${dateKey(post.data.date).replaceAll('-', '/')}/${post.id}`;
  const normalized = path.replace(/^\/+|\/+$/g, '');
  if (!normalized || normalized.split('/').some(part => part === '.' || part === '..') || /[?#\\]/.test(normalized)) {
    throw new Error(`Invalid permalink in ${post.id}`);
  }
  return `/${normalized}/`;
}
export function plainText(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, ' ')
    .replace(/^[ \t]*[-*+] /gm, '').replace(/^[ \t]*\d+\.\s+/gm, '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ').replace(/[#*`>|]/g, '').replace(/\s+/g, ' ').trim();
}
export function summary(post: Post): string {
  if (post.data.description) return post.data.description;
  const paragraphs = (post.body ?? '').split('<!-- more -->')[0]
    .split(/\n\s*\n/).filter(p => p.trim() && !/^\s*#/.test(p) && !/^\s*```/.test(p) && !/\]\(#/.test(p));
  const text = plainText(paragraphs[0] ?? '');
  return text.length > 100 ? `${text.slice(0, 100)}…` : text;
}
export function readingMinutes(post: Post): number {
  return Math.max(1, Math.ceil(plainText(post.body ?? '').length / 450));
}
export function taxonomy(posts: Post[], key: 'tags' | 'categories') {
  const entries = new Map<string, Post[]>();
  for (const post of posts) for (const value of new Set(post.data[key])) {
    entries.set(value, [...(entries.get(value) ?? []), post]);
  }
  return [...entries].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}
