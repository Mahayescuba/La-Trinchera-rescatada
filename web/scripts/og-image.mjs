// Genera los recursos de marca en /public en tiempo de build:
//  - og-default.jpg: tarjeta social (1200x630) para los textos sin imagen.
//  - favicon.svg + favicon-32.png + favicon-16.png + apple-touch-icon.png.
// Se generan aquí (y no se versionan) porque se regeneran en cada build (y están en .gitignore).
import sharp from 'sharp';
import fs from 'node:fs';

fs.mkdirSync('public', { recursive: true });

// ---- Tarjeta social -------------------------------------------------------
// Obra del archivo (duotono) de fondo + velo oscuro para legibilidad + título.
const OG_ART = 'public/archivo-covers/436095.jpg'; // Daumier, "El vagón de tercera"
const art = await sharp(OG_ART).resize(1200, 630, { fit: 'cover', position: 'attention' }).toBuffer();
const overlay = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#14100d" stop-opacity="0.95"/>
      <stop offset="0.52" stop-color="#14100d" stop-opacity="0.68"/>
      <stop offset="1" stop-color="#14100d" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#14100d" stop-opacity="0"/>
      <stop offset="1" stop-color="#14100d" stop-opacity="0.6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#gb)"/>
  <rect width="1200" height="12" fill="#8a2b2b"/>
  <text x="90" y="150" font-family="Georgia,'DejaVu Serif',serif" font-size="28" letter-spacing="7" fill="#d0685f" font-weight="bold">ARCHIVO RESCATADO · 2018–2022</text>
  <text x="86" y="360" font-family="Georgia,'DejaVu Serif',serif" font-size="150" fill="#f6efe6" font-weight="bold">La Trinchera</text>
  <text x="90" y="428" font-family="Georgia,'DejaVu Serif',serif" font-size="46" fill="#cbbfb2" font-style="italic">muchas maneras de estar</text>
  <text x="90" y="560" font-family="Georgia,'DejaVu Serif',serif" font-size="28" fill="#b3a99e">Debate de ideas desde Cuba</text>
  <text x="1110" y="560" text-anchor="end" font-family="Georgia,'DejaVu Serif',serif" font-size="26" fill="#8f857b">bloglatrinchera.com</text>
</svg>`;
await sharp(art).composite([{ input: Buffer.from(overlay) }]).jpeg({ quality: 84, mozjpeg: true }).toFile('public/og-default.jpg');

// ---- Favicon / icono de la marca -----------------------------------------
// Cuadrado vino con una "T" serif color crema: legible incluso a 16px.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="13" fill="#8a2b2b"/>
  <text x="32" y="47" font-family="Georgia,'DejaVu Serif',serif" font-size="46" font-weight="bold" fill="#fbf9f5" text-anchor="middle">T</text>
</svg>`;
// SVG escalable (icono principal en navegadores modernos)
fs.writeFileSync('public/favicon.svg', icon);
// Variantes PNG para compatibilidad y para iOS (apple-touch-icon)
await sharp(Buffer.from(icon)).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(icon)).resize(16, 16).png().toFile('public/favicon-16.png');
await sharp(Buffer.from(icon)).resize(180, 180).png().toFile('public/apple-touch-icon.png');

// ---- Tarjetas sociales por autor -----------------------------------------
// Para cada autor con foto verificada, una tarjeta 1200x630 (foto + nombre)
// que sirve de og:image al compartir su página en redes. Se regeneran en cada
// build (están en .gitignore); si no hay foto, la página usa og-default.jpg.
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const xesc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const wrapName = (name) => {
  const words = name.split(/\s+/), cpl = 18, lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (t.length > cpl && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
};
const authors = JSON.parse(fs.readFileSync('src/data/authors.json', 'utf8'));
fs.mkdirSync('public/autor-og', { recursive: true });
let cards = 0;
for (const [slug, prof] of Object.entries(authors)) {
  if (!prof || !prof.img) continue;
  const photoPath = 'public' + prof.img;
  if (!fs.existsSync(photoPath)) continue;
  const S = 300;
  const photo = await sharp(photoPath).resize(S, S, { fit: 'cover', position: 'attention' }).toBuffer();
  const cmask = Buffer.from(`<svg width="${S}" height="${S}"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="#fff"/></svg>`);
  const circle = await sharp(photo).composite([{ input: cmask, blend: 'dest-in' }]).png().toBuffer();
  const lines = wrapName(prof.name || '');
  const fsz = lines.length > 2 ? 58 : (lines.length > 1 ? 66 : 78);
  const startY = 315 - ((lines.length - 1) * fsz * 0.58);
  const tspans = lines.map((l, i) => `<text x="470" y="${(startY + i * fsz * 1.12).toFixed(1)}" font-family="Georgia,'DejaVu Serif',serif" font-size="${fsz}" fill="#f6efe6" font-weight="bold">${xesc(l)}</text>`).join('');
  const bg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a130d"/><stop offset="1" stop-color="#0f0b08"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect width="1200" height="12" fill="#8a2b2b"/>
    <circle cx="250" cy="315" r="156" fill="none" stroke="#8a2b2b" stroke-width="5"/>
    <text x="470" y="150" font-family="Georgia,'DejaVu Serif',serif" font-size="26" letter-spacing="6" fill="#d0685f" font-weight="bold">LA TRINCHERA · AUTOR</text>
    ${tspans}
    <text x="470" y="540" font-family="Georgia,'DejaVu Serif',serif" font-size="26" fill="#8f857b">bloglatrinchera.com</text>
  </svg>`;
  const base = await sharp(Buffer.from(bg)).png().toBuffer();
  await sharp(base).composite([{ input: circle, left: 100, top: 165 }]).jpeg({ quality: 84, mozjpeg: true }).toFile(`public/autor-og/${slug}.jpg`);
  cards++;
}

const kb = (f) => (fs.statSync('public/' + f).size / 1024).toFixed(0) + ' KB';
console.log(`Marca generada: og-default.jpg (${kb('og-default.jpg')}), favicon.svg, favicon-32/16.png, apple-touch-icon.png; ${cards} tarjetas de autor`);
