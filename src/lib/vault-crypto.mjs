export const VAULT_ITERATIONS = 600_000;
export const VAULT_MAX_BYTES = 16 * 1024 * 1024;
const context = new TextEncoder().encode('jesse-private-vault:v1');
const encoder = new TextEncoder();
const mimeTypes = new Set(['text/markdown', 'text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/webp']);
const envelopeKeys = ['version', 'algorithm', 'kdf', 'iterations', 'salt', 'iv', 'ciphertext'];

export function toBase64(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

export function fromBase64(text) {
  if (typeof text !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text)) throw new Error('Invalid encoding');
  return Uint8Array.from(atob(text), char => char.charCodeAt(0));
}

export function validatePassphrase(passphrase) {
  if (typeof passphrase !== 'string' || Array.from(passphrase).length < 20 || encoder.encode(passphrase).length > 1024 || /[\r\n\0]/.test(passphrase) || new Set(passphrase).size < 8) {
    throw new Error('Use a unique passphrase of at least 20 characters, preferably randomly generated.');
  }
}

export function validateEnvelope(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== envelopeKeys.slice().sort().join(',')) throw new Error('Invalid vault envelope');
  if (value.version !== 1 || value.algorithm !== 'AES-256-GCM' || value.kdf !== 'PBKDF2-SHA256' || value.iterations !== VAULT_ITERATIONS) throw new Error('Unsupported vault format');
  if (typeof value.ciphertext !== 'string' || value.ciphertext.length > Math.ceil((VAULT_MAX_BYTES + 16) / 3) * 4) throw new Error('Vault size limit exceeded');
  if (fromBase64(value.salt).length !== 16 || fromBase64(value.iv).length !== 12) throw new Error('Invalid vault parameters');
  const encryptedSize = fromBase64(value.ciphertext).length;
  if (encryptedSize < 16 || encryptedSize > VAULT_MAX_BYTES + 16) throw new Error('Invalid encrypted payload');
  return value;
}

export function validateVaultPayload(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.documents) || value.documents.length > 500) throw new Error('Invalid document collection');
  const ids = new Set();
  for (const doc of value.documents) {
    if (!doc || typeof doc.id !== 'string' || doc.id.length > 100 || ids.has(doc.id) || typeof doc.title !== 'string' || !doc.title || doc.title.length > 500 || typeof doc.filename !== 'string' || /[/\\\x00-\x1f]/.test(doc.filename) || doc.filename.length > 500 || !mimeTypes.has(doc.mime)) throw new Error('Invalid document metadata');
    ids.add(doc.id);
    if (doc.kind === 'markdown' && doc.mime === 'text/markdown' && typeof doc.html === 'string') continue;
    if (doc.kind === 'text' && doc.mime === 'text/plain' && typeof doc.text === 'string') continue;
    if (doc.kind === 'file' && typeof doc.data === 'string') {
      if (fromBase64(doc.data).length > 5 * 1024 * 1024) throw new Error('Attachment size limit exceeded');
      continue;
    }
    throw new Error('Invalid document content');
  }
  return value;
}

async function deriveKey(passphrase, salt, usage) {
  if (typeof passphrase !== 'string' || encoder.encode(passphrase).length > 1024) throw new Error('Invalid passphrase');
  const encoded = encoder.encode(passphrase);
  try {
    const material = await crypto.subtle.importKey('raw', encoded, 'PBKDF2', false, ['deriveKey']);
    return await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: VAULT_ITERATIONS }, material, { name: 'AES-GCM', length: 256 }, false, [usage]);
  } finally { encoded.fill(0); }
}

export async function encryptVault(payload, passphrase) {
  validatePassphrase(passphrase);
  validateVaultPayload(payload);
  const plaintext = encoder.encode(JSON.stringify(payload));
  if (plaintext.length > VAULT_MAX_BYTES) throw new Error('Document collection exceeds the 16 MiB limit');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  try {
    const key = await deriveKey(passphrase, salt, 'encrypt');
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: context, tagLength: 128 }, key, plaintext);
    return { version: 1, algorithm: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iterations: VAULT_ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
  } finally { plaintext.fill(0); }
}

export async function decryptVault(envelope, passphrase) {
  validateEnvelope(envelope);
  const key = await deriveKey(passphrase, fromBase64(envelope.salt), 'decrypt');
  const result = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(envelope.iv), additionalData: context, tagLength: 128 }, key, fromBase64(envelope.ciphertext));
  const plaintext = new Uint8Array(result);
  try { return validateVaultPayload(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext))); }
  finally { plaintext.fill(0); }
}
