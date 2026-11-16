// Builds the Ingrid token outputs from the Figma export.
//
//   src/ingrid.tokens.json  ->  dist/tokens.css        CSS custom properties (Light + Dark)
//                               dist/text-styles.css   one class per Figma text style
//                               dist/tokens.js/.d.ts   token paths -> var(--ingrid-…)
//
// Figma is the source of truth: every CSS variable name is the WEB code syntax set on the
// variable in Figma, and every alias stays an alias (var() pointing at var()).
// The logic lives in build-core.mjs, which the Figma export plugin also runs.
// No dependencies, so it runs anywhere Node 18+ runs: `node scripts/build.mjs`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTokenFiles } from './build-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src/ingrid.tokens.json');
const DIST = path.join(root, 'dist');

let result;
try {
  result = buildTokenFiles(JSON.parse(fs.readFileSync(SRC, 'utf8')));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

fs.mkdirSync(DIST, { recursive: true });
for (const [name, content] of Object.entries(result.files)) fs.writeFileSync(path.join(DIST, name), content);
console.log(`Built ${result.tokenCount} tokens and ${result.textStyleCount} text styles into ${path.relative(process.cwd(), DIST)}/`);
