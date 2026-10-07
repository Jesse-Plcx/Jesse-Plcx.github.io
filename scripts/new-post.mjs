import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const title = process.argv.slice(2).join(' ').trim();
if (!title) { console.error('用法：npm run new -- "文章标题"'); process.exit(1); }
const root = fileURLToPath(new URL('../source/_posts/', import.meta.url));
const stem = title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '').trim();
if (!stem || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem)) throw new Error('请使用有效的文章标题。');
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
await mkdir(root, { recursive: true });
const target = path.join(root, `${stem}.md`);
await writeFile(target, `---\ntitle: ${JSON.stringify(title)}\ndate: ${date}\ndescription: ""\ntags: []\ncategories: []\ndraft: true\n---\n\n在这里开始写。\n`, { flag: 'wx' });
console.log(`已创建草稿：${target}\n预览正文后，将 draft 改为 false 发布。`);
