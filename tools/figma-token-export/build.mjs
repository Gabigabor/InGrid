// Inlines packages/tokens/scripts/build-core.mjs into ui.html, so the plugin rebuilds dist/
// with exactly the code `npm run tokens` uses. Figma plugins must be single files.
//
//   node tools/figma-token-export/build.mjs           update ui.html
//   node tools/figma-token-export/build.mjs --check   fail if ui.html is out of date (CI)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const UI = path.join(here, 'ui.html');
const CORE = path.resolve(here, '../../packages/tokens/scripts/build-core.mjs');
const BEGIN = /^( *)\/\/ ---- BEGIN build-core .*$/m;
const END = /^ *\/\/ ---- END build-core ----$/m;

const ui = fs.readFileSync(UI, 'utf8');
const begin = ui.match(BEGIN);
const end = ui.match(END);
if (!begin || !end || end.index < begin.index) throw new Error('ui.html is missing the build-core markers.');

let core = fs.readFileSync(CORE, 'utf8');
if (/<\/script/i.test(core)) throw new Error('build-core.mjs contains "</script", which would break ui.html.');
if (/^\s*import\s/m.test(core)) throw new Error('build-core.mjs must not import anything; it is inlined into the plugin.');
core = core.replace(/^export (function|const) /gm, '$1 ');

const indent = begin[1];
const body = core.trimEnd().split('\n').map((l) => (l ? indent + l : '')).join('\n');
const startOfBody = begin.index + begin[0].length + 1;
const next = ui.slice(0, startOfBody) + body + '\n' + ui.slice(end.index);

if (process.argv.includes('--check')) {
  if (next !== ui) {
    console.error('tools/figma-token-export/ui.html is out of date with build-core.mjs. Run npm run plugin and commit ui.html.');
    process.exit(1);
  }
  console.log('Plugin build-core is up to date.');
} else {
  fs.writeFileSync(UI, next);
  console.log('Inlined build-core.mjs into tools/figma-token-export/ui.html.');
}
