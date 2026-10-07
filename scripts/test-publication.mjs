import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const fixtures = [
  { name: '__publication-draft-test.md', title: 'PUBLICATION_DRAFT_SENTINEL', date: '2020-01-01', draft: true },
  { name: '__publication-future-test.md', title: 'PUBLICATION_FUTURE_SENTINEL', date: '2999-01-01', draft: false },
];
function build() {
  for (const args of [
    ['node_modules/astro/bin/astro.mjs', 'build'],
    ['node_modules/pagefind/lib/runner/bin.cjs', '--site', 'dist'],
  ]) {
    const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, 'Build failed during publication test');
  }
}
function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]); }
const created = [];
try {
  for (const fixture of fixtures) {
    const target = path.join(root, 'source/_posts', fixture.name);
    fs.writeFileSync(target, `---\ntitle: ${fixture.title}\ndate: ${fixture.date}\ndraft: ${fixture.draft}\n---\n\n${fixture.title}\n`, {flag:'wx'});
    created.push(target);
  }
  build();
  for (const file of walk(path.join(root, 'dist')).filter(f=>/\.(html|json|xml)$/.test(f))) {
    const text = fs.readFileSync(file,'utf8');
    for (const fixture of fixtures) assert(!text.includes(fixture.title), `Unpublished content exposed in ${file}`);
  }
  console.log('Draft and future publication exclusion passed.');
} finally {
  for (const file of created) fs.unlinkSync(file);
  if (created.length) build();
}
