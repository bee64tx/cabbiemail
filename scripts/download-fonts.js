const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'public/assets/fonts');
const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetch(res.headers.location, headers).then(resolve, reject);
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          })
        );
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

function downloadToFile(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadToFile(res.headers.location, dest).then(resolve, reject);
        }
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on('finish', resolve);
        ws.on('error', reject);
      })
      .on('error', reject);
  });
}

(async () => {
  fs.mkdirSync(FONTS_DIR, { recursive: true });

  // Fetch the CSS from Google Fonts
  const res = await fetch(CSS_URL, { 'User-Agent': UA });
  if (res.statusCode !== 200) {
    throw new Error(`Failed to fetch Google Fonts CSS: HTTP ${res.statusCode}`);
  }
  const css = res.body.toString('utf-8');

  // Parse @font-face blocks (Google puts a comment like /* latin */ before each block)
  const blockRe = /\/\*\s*([^*]+?)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  const blocks = [];
  let m;

  while ((m = blockRe.exec(css)) !== null) {
    const subset = m[1].trim();
    const body = m[2];

    const family = (body.match(/font-family:\s*['"]([^'"]+)['"]/) || [])[1];
    const weight = (body.match(/font-weight:\s*(\d+)/) || [])[1] || '400';
    const style = (body.match(/font-style:\s*(\w+)/) || [])[1] || 'normal';
    const unicodeRange = (body.match(/unicode-range:\s*([^;]+)/) || [])[1];
    const woff2Url = (body.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1];

    if (!family || !woff2Url) continue;

    const slug = family.toLowerCase().replace(/\s+/g, '-');
    const filename = `${slug}-${weight}-${style}-${subset.replace(/\s+/g, '-')}.woff2`;

    blocks.push({ family, weight, style, unicodeRange, woff2Url, filename, subset });
  }

  if (blocks.length === 0) {
    throw new Error('No @font-face blocks found in Google Fonts CSS');
  }

  // Download each WOFF2 file
  for (const block of blocks) {
    const dest = path.join(FONTS_DIR, block.filename);
    await downloadToFile(block.woff2Url, dest);
    console.log(`✔ ${block.filename}`);
  }

  // Generate fonts.css
  const cssRules = blocks
    .map(
      (b) =>
        `/* ${b.subset} */\n@font-face {\n  font-family: '${b.family}';\n  font-style: ${b.style};\n  font-weight: ${b.weight};\n  font-display: swap;\n  src: url(./${b.filename}) format('woff2');\n  unicode-range: ${b.unicodeRange};\n}`
    )
    .join('\n\n');

  fs.writeFileSync(path.join(FONTS_DIR, 'fonts.css'), cssRules + '\n');
  console.log('✔ fonts.css');

  console.log('Done — all fonts downloaded successfully.');
})();
