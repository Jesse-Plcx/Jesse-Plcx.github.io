import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'scripts/legacy-urls.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(output, 'search-index.json'), 'utf8'));
function walk(dir) { return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
const files = walk(output);
const htmls = files.filter(f => f.endsWith('.html'));
const broken = new Set();
let referenceCount = 0;
let articleCount = 0;
let mathCount = 0;
for (const url of baseline) assert(fs.existsSync(path.join(output, decodeURIComponent(url), 'index.html')), `Missing original article: ${url}`);
for (const file of htmls) {
  const relative = path.relative(output, file).replaceAll('\\', '/');
  const { document } = parseHTML(fs.readFileSync(file, 'utf8'));
  const article = document.querySelector('[data-pagefind-body]');
  if (article) {
    articleCount++;
    mathCount += article.querySelectorAll('.katex').length;
    assert(!article.querySelector('.katex-error'), `Math rendering error in ${relative}`);
    assert(!article.querySelector('.prose')?.textContent.includes('$$'), `Raw display math remains in ${relative}`);
  }
  const canonical = document.querySelector('link[rel=canonical]')?.getAttribute('href');
  assert(canonical?.startsWith('https://jesse-plcx.github.io/'), `Wrong canonical in ${relative}`);
  for (const el of document.querySelectorAll('a[href],img[src],script[src],link[rel=stylesheet][href]')) {
    const value = el.getAttribute('src') ?? el.getAttribute('href');
    if (!value || value.startsWith('#') || value.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(value)) continue;
    const url = new URL(value, 'https://local.invalid/' + relative);
    let target = path.join(output, decodeURIComponent(url.pathname));
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    referenceCount++;
    if (!fs.existsSync(target)) broken.add(`${relative}: ${value}`);
  }
}
assert.equal(broken.size, 0, `Broken references:\n${[...broken].join('\n')}`);
assert.equal(articleCount, index.length, 'Website and search disagree on published articles');
assert(mathCount > 0, 'Expected rendered formulas from the migrated notes');
assert(fs.existsSync(path.join(output, 'pagefind/pagefind.js')), 'Missing Pagefind index');
assert(fs.existsSync(path.join(output, 'sitemap-index.xml')), 'Missing sitemap');
for (const file of files) assert(!/(?:^|[/\\])(?:_private_posts|mykey\.txt(?:\.pub)?|\.env|\.git)(?:$|[/\\])|\.pem$/i.test(path.relative(output,file)), 'Private file in publication output');
for (const entry of index) assert(!entry.url.includes('_private_posts'), 'Private article in search');
console.log(`Verified ${articleCount} articles, ${baseline.length} original URLs, ${referenceCount} internal references, ${mathCount} rendered formulas, sitemap and search.`);
