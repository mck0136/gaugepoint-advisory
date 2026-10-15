import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const pages = ['index.html', 'about/index.html', 'ai-readiness/index.html', 'ai-in-transportation/index.html',
  'ai-native-development/index.html', 'operating-transformation/index.html', 'speaking-media/index.html',
  'contact/index.html', 'insights/freight-market-tightening/index.html'];

test('production pages have no staging restrictions or dependencies', () => {
  for (const file of pages) {
    const html = read(file);
    assert.doesNotMatch(html, /noindex|nofollow|127\.0\.0\.1|localhost|preview-shell\.|assessment-preview\./);
    assert.match(html, /src="\/site-shell\.js[^\"]*" data-site-shell defer/);
    for (const [, reference] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (!reference || /^(?:https?:|mailto:|tel:|data:|#)/.test(reference)) continue;
      const url = new URL(reference, `https://www.gaugepointconsulting.com/${file}`);
      const target = path.join(root, decodeURIComponent(url.pathname));
      assert.ok(existsSync(target), `${file} references missing ${reference}`);
    }
  }
});

test('release includes the approved assessment order, portrait removal and platform order', () => {
  const sections = [...read('index.html').matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.deepEqual(sections, ['top', 'approach', 'technology-judgment', 'before-ai', 'readiness-system',
    'expertise', 'audiences', 'supply-chain', 'interstate', 'operating-system', 'operating-transformation',
    'governance', 'industry-evidence', 'speaking-media', 'freight-market', 'founder', 'contact']);
  assert.doesNotMatch(read('index.html'), /<img[^>]+mark-mckendry-portrait/);
  const platform = read('ai-native-development/index.html');
  assert.deepEqual([...platform.matchAll(/data-demo="([^"]+)"/g)].map(([, id]) => id), ['commercial', 'portal', 'managed']);
  assert.match(platform, /Plan &amp; tender/);
  assert.match(platform, /data-vendor-change/);
});

test('contact submission retains its production handler without a preview blocker', () => {
  assert.match(read('contact/index.html'), /action="\/api\/contact" method="post"/);
  assert.match(read('script.js'), /fetch\(contactForm\.action/);
  assert.doesNotMatch(read('site-shell.js'), /Preview only|No message has been sent|stopImmediatePropagation|contact-form.*forEach/);
  assert.match(read('api/contact.js'), /submitContact\(payload, process\.env\)/);
});

test('shared shell owns header and footer without detached legacy navigation', () => {
  const header = { innerHTML: 'untouched-header' };
  const footer = { innerHTML: 'untouched-footer' };
  const document = {
    body: { dataset: {} },
    querySelector: selector => ({
      'script[data-site-shell]': {}, '#site-header': header,
      '#site-footer': footer, main: { id: 'main-content' }
    })[selector] ?? null
  };
  const script = read('script.js');
  vm.runInNewContext(script.slice(0, script.indexOf('const siteHeader =')), { document, window: {} });
  assert.equal(header.innerHTML, 'untouched-header');
  assert.equal(footer.innerHTML, 'untouched-footer');
  assert.match(read('site-shell.js'), /menu\?\.addEventListener\("keydown"/);
});

test('build includes release styles and excludes preview wrappers', () => {
  const build = read('scripts/build.mjs');
  for (const file of ['site-shell.js', 'site-shell.css', 'home-layout.css', 'site-typography.css', 'ai-native-development']) assert.ok(build.includes(`"${file}"`));
  assert.doesNotMatch(build, /mobile-preview|assessment-preview|preview-shell/);
});
