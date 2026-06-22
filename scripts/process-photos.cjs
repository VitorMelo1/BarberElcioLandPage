/* Converte/otimiza as fotos cruas de docs/fotos -> public/images/portfolio.
   Auto-orienta (EXIF), redimensiona p/ web, exporta JPEG progressivo. */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "../../docs/fotos");
const OUT = path.resolve(__dirname, "../public/images/portfolio");
fs.mkdirSync(OUT, { recursive: true });

const files = fs
  .readdirSync(SRC)
  .filter((f) => /\.(jpe?g|png|heic|heif|webp)$/i.test(f))
  .sort();

(async () => {
  let i = 0;
  for (const f of files) {
    i++;
    const id = String(i).padStart(2, "0");
    const out = path.join(OUT, `look-${id}.jpg`);
    try {
      const img = sharp(path.join(SRC, f), { failOn: "none" }).rotate();
      await img
        .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toFile(out);
      const m = await sharp(out).metadata();
      const kb = (fs.statSync(out).size / 1024).toFixed(0);
      console.log(`${f}  ->  look-${id}.jpg   ${m.width}x${m.height}  ${kb}KB`);
    } catch (e) {
      console.log(`SKIP ${f}: ${e.message}`);
    }
  }
})();
