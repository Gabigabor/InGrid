// Checks every component stylesheet in packages/react/src:
//   1. each var(--ingrid-…) it uses exists in packages/tokens/dist/tokens.css (so a renamed
//      or deleted Figma variable breaks the build instead of silently rendering nothing);
//   2. it contains no raw design values (hex/rgb colours, px/rem sizes, font names).
import fs from 'node:fs';
import path from 'node:path';

const tokensCss = fs.readFileSync('packages/tokens/dist/tokens.css', 'utf8');
const defined = new Set([...tokensCss.matchAll(/(--ingrid-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith('.css')) files.push(p);
  }
};
walk('packages/react/src');

const problems = [];
for (const file of files) {
  const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  css.split('\n').forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    for (const [, name] of line.matchAll(/var\((--ingrid-[a-z0-9-]+)/g)) {
      if (!defined.has(name)) problems.push(`${where}  ${name} is not an Ingrid token`);
    }
    // Raw values are not allowed; 0, 100% and the 1-px-free keywords are fine.
    if (/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b\d*\.?\d+(px|rem|em)\b/i.test(line)) {
      problems.push(`${where}  raw value: ${line.trim()}`);
    }
  });
}

if (problems.length) {
  console.error(`Component CSS uses values that are not Ingrid tokens:\n${problems.map((p) => '  ' + p).join('\n')}`);
  process.exit(1);
}
console.log(`${files.length} stylesheet(s) use only Ingrid tokens (${defined.size} tokens defined).`);
