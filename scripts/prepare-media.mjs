import sharp from "sharp";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "assets-source");
const outImages = path.join(root, "public/media/images");
const outPosters = path.join(root, "public/media/posters");
const outVideos = path.join(root, "public/media/videos");
const outPrivate = path.join(root, "storage/private");

await Promise.all(
  [outImages, outPosters, outVideos, outPrivate].map((dir) => mkdir(dir, { recursive: true })),
);

const images = [
  ["01_Atlantis_1.0/images/Atlantis_1.0_original_flyer.jpeg", "atlantis-1-flyer.webp", 1500],
  ["02_Atlantis_2.0/images/Atlantis_2.0_general_flyer.jpeg", "atlantis-2-flyer.webp", 1500],
  ["02_Atlantis_2.0/images/Atlantis_2.0_artist_DJ_hypemen_lineup.jpeg", "atlantis-2-lineup.webp", 1500],
  ["02_Atlantis_2.0/images/Atlantis_2.0_Scotty_Olorin_promo.jpeg", "atlantis-2-scotty-olorin.webp", 1500],
  ["02_Atlantis_2.0/images/Atlantis_2.0_Wavestar_promo.jpeg", "atlantis-2-wavestar.webp", 1500],
  ["03_Atlantis_3.0/images/Atlantis_3.0_original_flyer.jpeg", "atlantis-3-flyer.webp", 1500],
  [
    "04_Atlantis_4.0/images/Atlantis_4.0_December_30_Juice_WRLD_tribute_flyer.jpeg",
    "atlantis-4-flyer.webp",
    1500,
  ],
];

for (const [from, to, width] of images) {
  const input = path.join(src, from);
  const output = path.join(outImages, to);
  await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 86, effort: 5 })
    .toFile(output);
  const meta = await sharp(output).metadata();
  console.log(`image ${to} ${meta.width}x${meta.height}`);
}

for (let i = 2; i <= 10; i += 1) {
  const padded = String(i).padStart(2, "0");
  const from = path.join(src, `03_Atlantis_3.0/video_posters/Atlantis_3.0_video_${padded}_poster.jpg`);
  const to = path.join(outPosters, `atlantis-3-poster-${padded}.webp`);
  await sharp(from).resize({ width: 720 }).webp({ quality: 82 }).toFile(to);
  await copyFile(
    path.join(src, `03_Atlantis_3.0/videos/event_highlights/Atlantis_3.0_highlight_${padded}.mp4`),
    path.join(outVideos, `atlantis-3-highlight-${padded}.mp4`),
  );
}

// The selfie-like clip and its poster stay outside the public web root until an
// administrator reviews and explicitly publishes it.
await copyFile(
  path.join(src, "03_Atlantis_3.0/videos/review_before_publishing/Atlantis_3.0_clip_review_01.mp4"),
  path.join(outPrivate, "atlantis-3-clip-review-01.mp4"),
);
await copyFile(
  path.join(src, "03_Atlantis_3.0/video_posters/Atlantis_3.0_video_01_poster.jpg"),
  path.join(outPrivate, "atlantis-3-clip-review-01-poster.jpg"),
);

const flyer = path.join(outImages, "atlantis-4-flyer.webp");
const og = await sharp(flyer)
  .resize({ width: 1200 })
  .extract({ left: 0, top: 250, width: 1200, height: 630 })
  .modulate({ brightness: 0.72 })
  .jpeg({ quality: 88 })
  .toBuffer();
await writeFile(path.join(root, "public/og-atlantis.jpg"), og);

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#080808"/>
  <rect x="14" y="14" width="484" height="484" fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <path d="M256 96 L382 416 H318 L292 348 H220 L194 416 H130 Z M238 288 H274 L256 230 Z" fill="#F5F2ED"/>
  <rect x="120" y="444" width="272" height="8" fill="#E53935"/>
</svg>`;
await sharp(Buffer.from(iconSvg)).png().toFile(path.join(root, "src/app/icon.png"));
await sharp(Buffer.from(iconSvg)).resize(180).png().toFile(path.join(root, "src/app/apple-icon.png"));

console.log("Media preparation complete.");
