// Generates every raster icon the application ships, from one vector source
// (scripts/icon-source.svg). Run with: npm run build:icons
//
// Rasterizing is done by the Chrome already installed on the machine rather
// than by an image library, for the same reason the OG image is: adding a
// native-code dependency to a site that ships four icons is a cost with no
// constraint behind it. The outputs are committed, so a normal build and CI
// never need Chrome.
//
// What each output is for, because the formats are not interchangeable:
//   app/icon.svg            the favicon modern browsers prefer, sharp at any size
//   app/favicon.ico         the /favicon.ico that crawlers and older browsers still ask for
//   app/apple-icon.png      iOS home screen: PNG only, full-bleed, no transparency
//   public/icons/*.png      the web app manifest, including a maskable variant

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = promisify(execFile);

const CHROME =
    process.env.CHROME_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const PRIMARY = '#1E3A8A';
const ACCENT = '#D97706';

/**
 * The mark itself, in a 64x64 box. `cornerRadius` is 0 for surfaces that apply
 * their own mask (iOS, Android maskable), and `inset` shrinks the drawing into
 * the safe zone those masks crop to.
 */
function markSvg({ cornerRadius, inset = 0 }) {
    const scale = (64 - 2 * inset) / 64;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<rect width="64" height="64" rx="${cornerRadius}" fill="${PRIMARY}"/>
<g transform="translate(${inset} ${inset}) scale(${scale})">
<circle cx="32" cy="32" r="19" fill="none" stroke="#FFFFFF" stroke-width="5"/>
<rect x="18" y="26" width="28" height="5" rx="2.5" fill="#FFFFFF"/>
<rect x="18" y="34.5" width="28" height="5" rx="2.5" fill="${ACCENT}"/>
</g>
</svg>`;
}

const OUTPUTS = [
    // The manifest's ordinary icons keep the rounded square: nothing masks them.
    { path: 'public/icons/icon-192.png', size: 192, svg: markSvg({ cornerRadius: 14 }) },
    { path: 'public/icons/icon-512.png', size: 512, svg: markSvg({ cornerRadius: 14 }) },
    // Maskable: full bleed, drawing inside the 80% safe circle Android crops to.
    { path: 'public/icons/icon-maskable-512.png', size: 512, svg: markSvg({ cornerRadius: 0, inset: 8 }) },
    // iOS rounds the corners itself and shows transparency as black.
    { path: 'app/apple-icon.png', size: 180, svg: markSvg({ cornerRadius: 0 }) }
];

const ICO_SIZES = [16, 32, 48];

async function renderPng(svg, size, outPath, workDir) {
    // Chrome screenshots a viewport, so the page is exactly the icon and
    // nothing else: no margin, no scrollbars, transparent outside the shape.
    const page = join(workDir, `icon-${size}.html`);
    await writeFile(
        page,
        `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
    );
    await run(CHROME, [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--default-background-color=00000000',
        `--window-size=${size},${size}`,
        `--screenshot=${outPath}`,
        `file://${page}`
    ]);
}

/**
 * An .ico is a directory of images; since Windows Vista each one may be a PNG
 * as-is, which is what every browser reads today. Header 6 bytes, then one
 * 16-byte entry per size, then the PNG payloads.
 */
function buildIco(images) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // 1 = icon
    header.writeUInt16LE(images.length, 4);

    const directory = Buffer.alloc(16 * images.length);
    let offset = header.length + directory.length;
    images.forEach((image, index) => {
        const entry = 16 * index;
        directory.writeUInt8(image.size === 256 ? 0 : image.size, entry); // width
        directory.writeUInt8(image.size === 256 ? 0 : image.size, entry + 1); // height
        directory.writeUInt8(0, entry + 2); // palette: none, the PNG carries its own
        directory.writeUInt8(0, entry + 3); // reserved
        directory.writeUInt16LE(1, entry + 4); // colour planes
        directory.writeUInt16LE(32, entry + 6); // bits per pixel
        directory.writeUInt32LE(image.data.length, entry + 8);
        directory.writeUInt32LE(offset, entry + 12);
        offset += image.data.length;
    });

    return Buffer.concat([header, directory, ...images.map((image) => image.data)]);
}

async function main() {
    const workDir = await mkdtemp(join(tmpdir(), 'crible-icons-'));
    try {
        for (const output of OUTPUTS) {
            await renderPng(output.svg, output.size, output.path, workDir);
            console.log(`${output.path}\t${output.size}px`);
        }

        // The favicon carries the rounded square, like the tab of any other app.
        const icoSvg = markSvg({ cornerRadius: 14 });
        const images = [];
        for (const size of ICO_SIZES) {
            const png = join(workDir, `ico-${size}.png`);
            await renderPng(icoSvg, size, png, workDir);
            images.push({ size, data: await readFile(png) });
        }
        await writeFile('app/favicon.ico', buildIco(images));
        console.log(`app/favicon.ico\t${ICO_SIZES.join(', ')}px`);
    } finally {
        await rm(workDir, { recursive: true, force: true });
    }
}

await main();
