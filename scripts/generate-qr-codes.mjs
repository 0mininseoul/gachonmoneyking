import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { createPosterQrUrl } from '../src/lib/qrAttribution.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outputDir = resolve(repoRoot, 'output', 'qr');

const posterLocales = [
  ['ko', 'Korean'],
  ['en', 'English'],
  ['zh', 'Chinese'],
  ['vi', 'Vietnamese'],
  ['mn', 'Mongolian'],
  ['uz', 'Uzbek'],
  ['ja', 'Japanese'],
];

await mkdir(outputDir, { recursive: true });

const manifest = [];

for (const [locale, label] of posterLocales) {
  const url = createPosterQrUrl(locale);
  const basename = `gachon-money-king-qr-${locale}`;
  const pngPath = resolve(outputDir, `${basename}.png`);
  const svgPath = resolve(outputDir, `${basename}.svg`);

  await QRCode.toFile(pngPath, url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    scale: 12,
    type: 'png',
  });

  await QRCode.toFile(svgPath, url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    type: 'svg',
  });

  manifest.push({
    locale,
    label,
    url,
    png: `output/qr/${basename}.png`,
    svg: `output/qr/${basename}.svg`,
  });
}

const markdown = [
  '# Gachon Money King QR Codes',
  '',
  '| Language | QR URL | PNG | SVG |',
  '| --- | --- | --- | --- |',
  ...manifest.map((item) => (
    `| ${item.label} (${item.locale}) | ${item.url} | ${item.png} | ${item.svg} |`
  )),
  '',
].join('\n');

await writeFile(resolve(outputDir, 'qr-codes.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(resolve(outputDir, 'README.md'), markdown);

console.log(`Generated ${manifest.length} QR code sets in ${outputDir}`);
