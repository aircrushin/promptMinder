const sharp = require('sharp');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = path.join(__dirname, '../public/logo.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  for (const size of sizes) {
    try {
      await sharp(sourceIcon)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      console.log(`✓ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Error generating icon-${size}x${size}.png:`, error.message);
    }
  }
  console.log('\nIcon generation complete!');
}

generateIcons().catch(console.error);
