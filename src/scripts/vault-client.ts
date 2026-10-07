import DOMPurify from 'dompurify';
import { decryptVault, fromBase64, validateEnvelope } from '../lib/vault-crypto.mjs';

interface PrivateDocument { id: string; title: string; filename: string; mime: string; kind: 'markdown' | 'text' | 'file'; html?: string; text?: string; data?: string; }
interface VaultPayload { version: 1; documents: PrivateDocument[]; }
const form = document.querySelector<HTMLFormElement>('#vault-form')!;
const input = document.querySelector<HTMLInputElement>('#vault-passphrase')!;
const unlockButton = document.querySelector<HTMLButtonElement>('#vault-unlock')!;
const locked = document.querySelector<HTMLDivElement>('#vault-locked')!;
const workspace = document.querySelector<HTMLDivElement>('#vault-workspace')!;
const status = document.querySelector<HTMLParagraphElement>('#vault-status')!;
const list = document.querySelector<HTMLDivElement>('#vault-list')!;
const title = document.querySelector<HTMLHeadingElement>('#vault-title')!;
const content = document.querySelector<HTMLDivElement>('#vault-content')!;
const count = document.querySelector<HTMLParagraphElement>('#vault-count')!;
const download = document.querySelector<HTMLAnchorElement>('#vault-download')!;
let envelope: ReturnType<typeof validateEnvelope> | null = null;
let collection: VaultPayload | null = null;
let objectUrl: string | null = null;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let lastActivity = 0;
let operation = 0;
const idleTime = 10 * 60 * 1000;

function clearDocument() {
  content.replaceChildren(); title.textContent = ''; download.hidden = true;
  download.removeAttribute('href'); download.removeAttribute('download');
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
}

function lock(message = '已锁定。再次输入口令可查看文档。') {
  operation++; collection = null; clearDocument(); list.replaceChildren(); count.textContent = '';
  if (idleTimer) clearTimeout(idleTimer);
  workspace.hidden = true; locked.hidden = false; input.value = '';
  unlockButton.disabled = envelope === null; unlockButton.textContent = '解锁文档';
  status.textContent = message;
}

function resetIdle() {
  if (!collection) return;
  lastActivity = Date.now();
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => lock('长时间没有操作，文档已自动锁定。'), idleTime);
}

function selectDocument(doc: PrivateDocument, focus = true) {
  clearDocument(); title.textContent = doc.title;
  for (const button of list.querySelectorAll<HTMLButtonElement>('button')) button.setAttribute('aria-current', button.dataset.documentId === doc.id ? 'true' : 'false');
  if (doc.kind === 'markdown') {
    const fragment = DOMPurify.sanitize(doc.html ?? '', { RETURN_DOM_FRAGMENT: true, FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'] });
    content.replaceChildren(fragment);
    for (const image of content.querySelectorAll<HTMLImageElement>('img')) {
      const src = image.getAttribute('src') ?? '';
      try {
        const url = new URL(src, location.origin);
        if (url.origin !== location.origin || !url.pathname.startsWith('/p_imgs/') || url.search) image.remove();
        else image.referrerPolicy = 'no-referrer';
      } catch { image.remove(); }
    }
    for (const link of content.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      const href = link.getAttribute('href') ?? '';
      if (!href.startsWith('#') && !/^https?:\/\//i.test(href)) link.removeAttribute('href');
      else if (!href.startsWith('#')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    }
  } else if (doc.kind === 'text') {
    const pre = document.createElement('pre'); pre.className = 'vault-plain-text'; pre.textContent = doc.text ?? ''; content.append(pre);
  } else {
    const bytes = fromBase64(doc.data ?? '');
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    objectUrl = URL.createObjectURL(new Blob([buffer], { type: doc.mime })); bytes.fill(0);
    download.href = objectUrl; download.download = doc.filename; download.hidden = false;
    if (doc.mime.startsWith('image/')) {
      const image = document.createElement('img'); image.src = objectUrl; image.alt = doc.title; content.append(image);
    } else {
      const note = document.createElement('p'); note.textContent = '文件已经解锁，可下载后查看。'; content.append(note);
    }
  }
  resetIdle();
  if (focus) title.focus({ preventScroll: true });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!envelope || unlockButton.disabled) return;
  const current = ++operation;
  const passphrase = input.value; input.value = '';
  unlockButton.disabled = true; unlockButton.textContent = '正在解锁…'; status.textContent = '正在解锁文档，请稍候。';
  try {
    const payload = await decryptVault(envelope, passphrase) as VaultPayload;
    if (current !== operation) return;
    collection = payload; list.replaceChildren(); count.textContent = `${payload.documents.length} 份文档`;
    for (const doc of payload.documents) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.documentId = doc.id;
      const name = document.createElement('span'); name.textContent = doc.title;
      const kind = document.createElement('small'); kind.textContent = doc.filename.split('.').at(-1)?.toUpperCase() ?? 'FILE';
      button.append(name, kind); button.addEventListener('click', () => selectDocument(doc)); list.append(button);
    }
    locked.hidden = true; workspace.hidden = false;
    if (payload.documents[0]) selectDocument(payload.documents[0], false);
    resetIdle();
  } catch {
    if (current === operation) { status.textContent = '口令不正确，或加密文件已损坏，请检查后重试。'; input.focus(); }
  } finally {
    if (current === operation) { unlockButton.disabled = false; unlockButton.textContent = '解锁文档'; }
  }
});

document.querySelector<HTMLButtonElement>('#vault-lock')!.addEventListener('click', () => { lock(); input.focus(); });
for (const event of ['pointerdown', 'keydown', 'scroll']) document.addEventListener(event, resetIdle, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && collection) {
    if (Date.now() - lastActivity >= idleTime) lock('长时间没有操作，文档已自动锁定。');
    else { if (idleTimer) clearTimeout(idleTimer); idleTimer = setTimeout(() => lock(), idleTime - (Date.now() - lastActivity)); }
  }
});
window.addEventListener('pagehide', () => lock());

async function prepare() {
  if (!window.isSecureContext || !crypto.subtle) { status.textContent = '请通过 HTTPS 访问私密文档专区。'; return; }
  try {
    const response = await fetch('/vault/data.json', { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (response.status === 404) { status.textContent = '私密文档还没有配置。请先在本机加密文档并发布。'; return; }
    if (!response.ok || Number(response.headers.get('content-length') ?? 0) > 24 * 1024 * 1024) throw new Error('Unavailable');
    const text = await response.text();
    if (text.length > 24 * 1024 * 1024) throw new Error('Oversized');
    envelope = validateEnvelope(JSON.parse(text));
    unlockButton.disabled = false; status.textContent = '请输入解锁口令。';
  } catch { status.textContent = '暂时无法读取私密文档，请稍后再试。'; }
}
void prepare();
