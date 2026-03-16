const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..');

const LOGO_SOURCE = path.join(ROOT, 'public/assets/logo-source.png');
const FAVICON_SOURCE = path.join(ROOT, 'public/assets/favicon-source.png');

(async () => {
  // Check source files exist
  const missing = [LOGO_SOURCE, FAVICON_SOURCE]
    .filter((f) => !fs.existsSync(f))
    .map((f) => path.relative(ROOT, f));

  if (missing.length > 0) {
    throw new Error(
      `Missing source file(s): ${missing.join(', ')}. Please place them before running the build.`
    );
  }

  // Logo pipeline
  const logoOut = path.join(ROOT, 'public/assets/logo.png');
  await sharp(LOGO_SOURCE).resize({ width: 240 }).toFile(logoOut);
  console.log(`✔ public/assets/logo.png (240px wide)`);

  // Favicon pipeline
  const faviconOutputs = [
    { file: 'public/favicon-32x32.png', width: 32, height: 32 },
    { file: 'public/favicon-16x16.png', width: 16, height: 16 },
    { file: 'public/apple-touch-icon.png', width: 180, height: 180 },
    { file: 'public/favicon.ico', width: 32, height: 32 },
  ];

  for (const { file, width, height } of faviconOutputs) {
    const outPath = path.join(ROOT, file);
    await sharp(FAVICON_SOURCE)
      .resize({ width, height, fit: 'contain' })
      .toFile(outPath);
    console.log(`✔ ${file} (${width}×${height})`);
  }

  console.log('Done — all assets built successfully.');
})();
