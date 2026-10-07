import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontmatter, unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { encryptVault } from '../src/lib/vault-crypto.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const types = new Map([
  ['.md', 'text/markdown'], ['.txt', 'text/plain'], ['.pdf', 'application/pdf'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp'],
]);

export function decodePassphraseInput(input) {
  // Windows PowerShell 5.1 can prepend a UTF-8 BOM to a native stdin pipe.
  // TextDecoder removes that transport marker while preserving password spaces.
  return new TextDecoder('utf-8', { fatal: true }).decode(input).replace(/\r?\n$/, '');
}

async function filesIn(directory) {
  let entries;
  try {
    if ((await fs.lstat(directory)).isSymbolicLink()) throw new Error('Private source directories cannot be symbolic links');
    entries = await fs.readdir(directory, { withFileTypes: true });
  }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isSymbolicLink()) throw new Error('Symbolic links are not supported in private document directories');
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(target));
    else if (entry.isFile() && types.has(path.extname(entry.name).toLowerCase())) files.push(target);
  }
  return files;
}

export async function packDocuments(root, passphrase) {
  const sources = [...await filesIn(path.join(root, 'source/_private_posts')), ...await filesIn(path.join(root, 'source/_private_files'))];
  if (!sources.length) throw new Error('No supported private documents found');
  const renderer = await unified({ remarkPlugins: [remarkMath], rehypePlugins: [[rehypeKatex, { strict: 'ignore', throwOnError: true }]] }).createRenderer({
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, langAlias: { pythonpython: 'python', gitignore: 'text' } },
  });
  const documents = [];
  for (const source of sources) {
    const stat = await fs.stat(source);
    if (stat.size > 5 * 1024 * 1024) throw new Error('Each private file must be 5 MiB or smaller');
    const bytes = await fs.readFile(source);
    const filename = path.basename(source);
    const mime = types.get(path.extname(source).toLowerCase());
    const base = { id: crypto.randomUUID(), filename, title: path.parse(filename).name, mime };
    if (mime === 'text/markdown') {
      const { frontmatter, content } = parseFrontmatter(bytes.toString('utf8'));
      const rendered = await renderer.render(content, { fileURL: pathToFileURL(source), frontmatter });
      documents.push({ ...base, title: typeof frontmatter.title === 'string' ? frontmatter.title : base.title, kind: 'markdown', html: rendered.code });
    } else if (mime === 'text/plain') {
      documents.push({ ...base, kind: 'text', text: bytes.toString('utf8') });
    } else { documents.push({ ...base, kind: 'file', data: bytes.toString('base64') }); }
    bytes.fill(0);
  }
  const envelope = await encryptVault({ version: 1, documents }, passphrase);
  return { envelope, count: documents.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--password-stdin') || process.stdin.isTTY) {
    console.error('请使用 .\\protect-private.ps1，在本机安全输入或生成口令。');
    process.exitCode = 1;
  } else {
    const input = readFileSync(0);
    try {
      const passphrase = decodePassphraseInput(input);
      input.fill(0);
      const { envelope, count } = await packDocuments(projectRoot, passphrase);
      const folder = path.join(projectRoot, 'static/vault');
      await fs.mkdir(folder, { recursive: true });
      const resolved = await fs.realpath(folder);
      if (!resolved.startsWith(projectRoot)) throw new Error('Vault output must remain in this project');
      const target = path.join(folder, 'data.json');
      try { if ((await fs.lstat(target)).isSymbolicLink()) throw new Error('Vault output cannot be a symbolic link'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      const temporary = path.join(folder, 'data.' + crypto.randomUUID() + '.tmp');
      await fs.writeFile(temporary, JSON.stringify(envelope) + '\n', { mode: 0o600, flag: 'wx' });
      await fs.rename(temporary, target);
      console.log(`已加密 ${count} 份文档。仅生成 static/vault/data.json，原始文档保持不变。\n现在可运行 npm run build，再提交并推送密文。`);
    } catch (error) {
      input.fill(0);
      console.error('私密文档加密失败。请检查口令长度、文件格式和大小，原始文档未修改。');
      process.exitCode = 1;
    }
  }
}
