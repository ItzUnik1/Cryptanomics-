import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const svg = await readFile(path.join(root, "public/cryptanomics-logo.svg"));
const res = path.join(root, "android/app/src/main/res");
const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

for (const [density, size] of Object.entries(sizes)) {
  const dir = path.join(res, `mipmap-${density}`);
  await mkdir(dir, { recursive: true });
  await sharp(svg).resize(size, size).png().toFile(path.join(dir, "ic_launcher.png"));
  await sharp(svg).resize(size, size).png().toFile(path.join(dir, "ic_launcher_round.png"));
  await sharp(svg).resize(size * 2.25, size * 2.25).png().toFile(path.join(dir, "ic_launcher_foreground.png"));
}

const anydpi = path.join(res, "mipmap-anydpi-v26");
await mkdir(anydpi, { recursive: true });
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/cryptanomics_icon_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
await writeFile(path.join(anydpi, "ic_launcher.xml"), adaptive);
await writeFile(path.join(anydpi, "ic_launcher_round.xml"), adaptive);
const values = path.join(res, "values");
await mkdir(values, { recursive: true });
await writeFile(path.join(values, "cryptanomics_colors.xml"), `<?xml version="1.0" encoding="utf-8"?>
<resources><color name="cryptanomics_icon_background">#070D1C</color></resources>
`);
console.log("Generated CRYPTANOMICS launcher icons.");
