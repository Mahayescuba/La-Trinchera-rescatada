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

const kb = (f) => (fs.statSync('public/' + f).size / 1024).toFixed(0) + ' KB';
console.log(`Marca generada: og-default.jpg (${kb('og-default.jpg')}), favicon.svg, favicon-32/16.png, apple-touch-icon.png`);
