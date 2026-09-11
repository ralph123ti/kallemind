// fix-logo.js
// Converts assets/logo.jpg.jpg into assets/logo.png with the white
// background removed and replaced with real transparency.
const sharp = require('sharp');
const path = require('path');

const INPUT = path.join(__dirname, 'assets', 'logo.jpg.jpg');
const OUTPUT = path.join(__dirname, 'assets', 'logo.png');

// Pixels with R, G, and B all >= this value are treated as "white"
// and made transparent. Lower it a bit if a faint white halo remains
// around the edges; raise it if parts of the logo's light areas
// (like the light blue) start disappearing.
const THRESHOLD = 235;

async function run() {
  const { data, info } = await sharp(INPUT)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
      data[i + 3] = 0; // set alpha to fully transparent
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(OUTPUT);

  console.log('Done — wrote', OUTPUT);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});