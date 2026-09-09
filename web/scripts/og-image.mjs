// Genera public/og-default.png: tarjeta social de marca (1200x630) para compartir
// los textos que no tienen imagen destacada.
import sharp from 'sharp';
import fs from 'node:fs';

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#fbf9f5"/>
  <rect width="1200" height="14" fill="#8a2b2b"/>
  <rect x="90" y="150" width="70" height="6" fill="#8a2b2b"/>
  <text x="90" y="132" font-family="Georgia,'DejaVu Serif',serif" font-size="30" letter-spacing="8" fill="#8a2b2b" font-weight="bold">ARCHIVO RESCATADO</text>
  <text x="86" y="360" font-family="Georgia,'DejaVu Serif',serif" font-size="150" fill="#1a1714" font-weight="bold">La Trinchera</text>
  <text x="90" y="430" font-family="Georgia,'DejaVu Serif',serif" font-size="46" fill="#6b625a" font-style="italic">muchas maneras de estar</text>
  <text x="90" y="558" font-family="Georgia,'DejaVu Serif',serif" font-size="30" fill="#6b625a">Debate de ideas desde Cuba · 2018–2021</text>
</svg>`;

fs.mkdirSync('public', { recursive: true });
await sharp(Buffer.from(svg)).png().toFile('public/og-default.png');
const { size } = fs.statSync('public/og-default.png');
console.log('public/og-default.png escrito ('+(size/1024).toFixed(0)+' KB, 1200x630)');
