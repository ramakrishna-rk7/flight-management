import sharp from 'sharp';
import { writeFileSync } from 'fs';

function createIconSvg(size) {
  const r = size * 0.18;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${r}" fill="#2563eb"/>
  <g transform="translate(${size/2},${size/2}) scale(${size/512})">
    <path d="M0-140 L50-40 180,20 50,30 30,120 0,90 -30,120 -50,30 -180,20 -50,-40Z" fill="white"/>
  </g>
</svg>`;
}

async function generate() {
  const svg192 = Buffer.from(createIconSvg(192));
  const svg512 = Buffer.from(createIconSvg(512));

  await sharp(svg192).png().toFile('public/icons/icon-192.png');
  await sharp(svg512).png().toFile('public/icons/icon-512.png');

  console.log('Generated: public/icons/icon-192.png');
  console.log('Generated: public/icons/icon-512.png');
}

generate().catch(console.error);
