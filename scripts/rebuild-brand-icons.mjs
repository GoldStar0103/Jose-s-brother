/**
 * Rebuild app icons + OG logo data URL from apps/web/src/assets/logo.png.
 * Run: node scripts/rebuild-brand-icons.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Install sharp temporarily: pnpm add -Dw sharp && node scripts/rebuild-brand-icons.mjs');
    process.exit(1);
  }

  const logoPath = join(root, 'apps/web/src/assets/logo.png');
  const webApp = join(root, 'apps/web/src/app');
  const logo = readFileSync(logoPath);

  // Square favicons on black — matches the live site chrome.
  const makeSquare = async (size, out) => {
    const buf = await sharp(logo)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 11, g: 13, b: 24, alpha: 1 },
      })
      .png()
      .toBuffer();
    writeFileSync(out, buf);
    console.log('wrote', out.replace(root + '\\', '').replace(root + '/', ''), `(${buf.length} bytes)`);
  };

  await makeSquare(512, join(webApp, 'icon.png'));
  await makeSquare(180, join(webApp, 'apple-icon.png'));

  // Admin panel tab icons (same mark — isolation is cookies/secrets, not art).
  const adminApp = join(root, 'apps/admin/src/app');
  await makeSquare(512, join(adminApp, 'icon.png'));
  await makeSquare(180, join(adminApp, 'apple-icon.png'));

  // Also publish under public/ — standalone Docker images serve these reliably.
  const webPublic = join(root, 'apps/web/public');
  await makeSquare(512, join(webPublic, 'icon.png'));
  await makeSquare(180, join(webPublic, 'apple-icon.png'));
  await makeSquare(512, join(webPublic, 'favicon.png'));

  // OG embedded JPEG 220×220 (see apps/web/src/lib/og-logo-data.ts header).
  const ogJpeg = await sharp(logo)
    .resize(220, 220, {
      fit: 'contain',
      background: { r: 11, g: 13, b: 24, alpha: 1 },
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  const dataUrl = `data:image/jpeg;base64,${ogJpeg.toString('base64')}`;
  const outTs = join(root, 'apps/web/src/lib/og-logo-data.ts');
  writeFileSync(
    outTs,
    `/**
 * The logo for the link-preview images, as a data URL. Generated — do not edit.
 *
 * Rebuilt from apps/web/src/assets/logo.png by scripts/rebuild-brand-icons.mjs.
 */
export const OG_LOGO_SIZE = 220;

export const OG_LOGO_DATA_URL =
  '${dataUrl}';
`,
  );
  console.log('wrote apps/web/src/lib/og-logo-data.ts', `(${ogJpeg.length} jpeg bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
