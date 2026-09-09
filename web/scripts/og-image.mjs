// Genera los recursos de marca en /public en tiempo de build:
//  - og-default.png: tarjeta social (1200x630) para los textos sin imagen.
//  - favicon.svg + favicon-32.png + favicon-16.png + apple-touch-icon.png.
// Se generan aquí (y no se versionan) porque *.png está en .gitignore.
import sharp from 'sharp';
import fs from 'node:fs';

fs.mkdirSync('public', { recursive: true });

// ---- Tarjeta social -------------------------------------------------------
const og = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#fbf9f5"/>
  <rect width="1200" height="14" fill="#8a2b2b"/>
  <rect x="90" y="150" width="70" height="6" fill="#8a2b2b"/>
  <text x="90" y="132" font-family="Georgia,'DejaVu Serif',serif" font-size="30" letter-spacing="8" fill="#8a2b2b" font-weight="bold">ARCHIVO RESCATADO</text>
  <text x="86" y="360" font-family="Georgia,'DejaVu Serif',serif" font-size="150" fill="#1a1714" font-weight="bold">La Trinchera</text>
  <text x="90" y="430" font-family="Georgia,'DejaVu Serif',serif" font-size="46" fill="#6b625a" font-style="italic">muchas maneras de estar</text>
  <text x="90" y="558" font-family="Georgia,'DejaVu Serif',serif" font-size="30" fill="#6b625a">Debate de ideas desde Cuba · 2018–2021</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile('public/og-default.png');

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
console.log(`Marca generada: og-default.png (${kb('og-default.png')}), favicon.svg, favicon-32/16.png, apple-touch-icon.png`);
