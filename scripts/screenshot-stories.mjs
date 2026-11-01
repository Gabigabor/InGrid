// Screenshots the AllVariants story from the static Storybook build, in Light and Dark,
// so a pull request carries visual evidence that the components still match Figma.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const dir = path.resolve('storybook-static');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const file = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  fs.readFile(fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(dir, 'index.html'), (err, data) => {
    res.writeHead(err ? 404 : 200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  });
}).listen(6007);

fs.mkdirSync('screenshots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
for (const theme of ['light', 'dark']) {
  await page.goto(`http://localhost:6007/iframe.html?id=inputs-button--all-variants&globals=theme:${theme}`);
  try {
    await page.locator('.ingrid-button').first().waitFor({ timeout: 20000 });
  } catch (e) {
    console.error(`Story did not render (${theme}):\n${errors.join('\n')}`);
    throw e;
  }
  await page.screenshot({ path: `screenshots/button-${theme}.png`, fullPage: true });
}
await browser.close();
server.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Saved screenshots/button-light.png and screenshots/button-dark.png');
