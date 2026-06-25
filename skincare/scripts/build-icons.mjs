import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = join(root, "assets", "icon.svg");
const out = join(root, "public");

await mkdir(out, { recursive: true });
const svg = await readFile(src);

// Apple touch icon — iOS uses this on the home screen (no rounded mask applied,
// they round it themselves). Square 180x180.
async function flat(size, name) {
  await sharp(svg).resize(size, size).png().toFile(join(out, name));
}

// Maskable variant — Android/Chrome apply a "safe zone" mask. We inset the
// design so the brand stays inside even if the OS crops to a circle/squircle.
async function maskable(size, name) {
  const inner = Math.round(size * 0.78); // 78% safe zone
  const pad = Math.round((size - inner) / 2);
  const innerPng = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 7, g: 8, b: 12, alpha: 1 },
    },
  })
    .composite([{ input: innerPng, top: pad, left: pad }])
    .png()
    .toFile(join(out, name));
}

await Promise.all([
  flat(180, "apple-touch-icon.png"),
  flat(192, "icon-192.png"),
  flat(512, "icon-512.png"),
  flat(32, "favicon-32.png"),
  flat(16, "favicon-16.png"),
  maskable(512, "icon-maskable-512.png"),
]);

console.log("✓ Icons generated in public/");
