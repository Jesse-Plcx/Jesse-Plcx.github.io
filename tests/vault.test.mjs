import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { encryptVault, decryptVault, validateEnvelope, validatePassphrase, fromBase64, toBase64 } from '../src/lib/vault-crypto.mjs';
import { packDocuments, decodePassphraseInput } from '../scripts/pack-vault.mjs';

const password = 'Synthetic-Test-Key-Only-2026!DoNotUse';
const payload = { version: 1, documents: [
  { id: 'note-one', title: 'PRIVATE_TEST_TITLE', filename: 'private-fixture.md', mime: 'text/markdown', kind: 'markdown', html: '<h2>PRIVATE_TEST_BODY</h2><p>中文内容。</p>' },
  { id: 'file-two', title: 'PRIVATE_ATTACHMENT_TITLE', filename: 'fixture.pdf', mime: 'application/pdf', kind: 'file', data: toBase64(new Uint8Array([0,1,2,254,255])) },
] };
let envelope;

test('password stdin removes the Windows PowerShell UTF-8 BOM without changing password characters', async () => {
  const inputs = [
    Buffer.from(password, 'utf8'),
    Buffer.from(password + '\n', 'utf8'),
    Buffer.from(password + '\r\n', 'utf8'),
    Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(password + '\r\n', 'utf8')]),
  ];
  for (const input of inputs) assert.equal(decodePassphraseInput(input), password);
  const unicode = ' 这是测试口令-安全-2026-Alpha! ';
  assert.equal(decodePassphraseInput(Buffer.from('\uFEFF' + unicode + '\r\n')), unicode);
  assert.throws(() => decodePassphraseInput(Buffer.from([0xff, 0xfe, 0x61])));
  const encrypted = await encryptVault(payload, decodePassphraseInput(inputs[3]));
  assert.deepEqual(await decryptVault(encrypted, password), payload);
});
test('encryption hides title, filename and body and round-trips all metadata and attachment bytes', async () => {
  envelope = await encryptVault(payload, password);
  assert.deepEqual(await decryptVault(envelope, password), payload);
  const serialized = JSON.stringify(envelope);
  for (const value of ['PRIVATE_TEST_TITLE','PRIVATE_TEST_BODY','private-fixture.md','PRIVATE_ATTACHMENT_TITLE',password]) assert(!serialized.includes(value));
  assert.deepEqual(fromBase64((await decryptVault(envelope,password)).documents[1].data), new Uint8Array([0,1,2,254,255]));
});
test('a wrong key cannot decrypt', async () => {
  await assert.rejects(() => decryptVault(envelope, 'Wrong-Synthetic-Test-Password-2026!'));
});
test('ciphertext and nonce tampering are rejected by authenticated encryption', async () => {
  const bytes = fromBase64(envelope.ciphertext); bytes[0] ^= 1;
  await assert.rejects(() => decryptVault({ ...envelope, ciphertext: toBase64(bytes) },password));
  const iv = fromBase64(envelope.iv); iv[0] ^= 1;
  await assert.rejects(() => decryptVault({ ...envelope, iv: toBase64(iv) },password));
});
test('fresh encryption uses fresh salt, nonce and ciphertext', async () => {
  const second = await encryptVault(payload,password);
  assert.notEqual(second.salt,envelope.salt); assert.notEqual(second.iv,envelope.iv); assert.notEqual(second.ciphertext,envelope.ciphertext);
});
test('unsupported parameters and plaintext extras fail before expensive decryption', () => {
  assert.throws(() => validateEnvelope({ ...envelope, iterations: 1_000_000_000 }));
  assert.throws(() => validateEnvelope({ ...envelope, version: 2 }));
  assert.throws(() => validateEnvelope({ ...envelope, plaintext: 'a document' }));
  assert.throws(() => validateEnvelope({ ...envelope, ciphertext: 'not base64!' }));
});
test('weak keys are rejected and Unicode keys work', async () => {
  assert.throws(() => validatePassphrase('short'));
  assert.throws(() => validatePassphrase('a'.repeat(32)));
  const unicode = '这是仅用于测试的长口令-安全-临时-2026-Alpha!';
  const encrypted = await encryptVault(payload,unicode);
  assert.deepEqual(await decryptVault(encrypted,unicode),payload);
});
test('packing reads only private folders and leaves source bytes unchanged', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'codex-vault-fixture-'));
  try {
    await fs.mkdir(path.join(root,'source/_private_posts'),{recursive:true});
    await fs.mkdir(path.join(root,'source/_private_files'),{recursive:true});
    await fs.mkdir(path.join(root,'source/_posts'),{recursive:true});
    const original = '---\ntitle: PRIVATE_PACK_TITLE\n---\n\nPRIVATE_PACK_BODY\n\n$$ E = mc^2 $$\n';
    await fs.writeFile(path.join(root,'source/_private_posts/private-fixture.md'),original);
    await fs.writeFile(path.join(root,'source/_private_files/fixture.txt'),'PRIVATE_TEXT_CONTENT');
    await fs.writeFile(path.join(root,'source/_posts/public.md'),'PUBLIC_NOTE_MUST_NOT_BE_PACKED');
    const result = await packDocuments(root,password);
    assert.equal(result.count,2);
    const unlocked = await decryptVault(result.envelope,password);
    assert(unlocked.documents.some(d => d.title === 'PRIVATE_PACK_TITLE' && d.html.includes('katex')));
    assert(unlocked.documents.some(d => d.text === 'PRIVATE_TEXT_CONTENT'));
    assert(!JSON.stringify(unlocked).includes('PUBLIC_NOTE_MUST_NOT_BE_PACKED'));
    assert.equal(await fs.readFile(path.join(root,'source/_private_posts/private-fixture.md'),'utf8'),original);
  } finally {
    const expectedRoot = path.resolve(os.tmpdir()) + path.sep;
    assert(root.startsWith(expectedRoot) && path.basename(root).startsWith('codex-vault-fixture-'));
    await fs.rm(root,{recursive:true,force:true});
  }
});
