import sharp from 'sharp'
import { readFileSync } from 'fs'

const svgBig = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="white"/>
  <circle cx="256" cy="256" r="220" stroke="#2D6A6A" stroke-width="34" stroke-dasharray="56 40" stroke-linecap="round" opacity="0.85"/>
  <circle cx="256" cy="256" r="220" stroke="#84b5b7" stroke-width="34" stroke-dasharray="56 40" stroke-dashoffset="96" stroke-linecap="round" opacity="0.6"/>
  <circle cx="256" cy="256" r="160" fill="#C4836A"/>
  <circle cx="208" cy="208" r="46" fill="#DFA892" opacity="0.75"/>
</svg>`

const sizes = [
  { file: 'public/pwa-64x64.png',           size: 64 },
  { file: 'public/pwa-192x192.png',          size: 192 },
  { file: 'public/pwa-512x512.png',          size: 512 },
  { file: 'public/maskable-icon-512x512.png',size: 512 },
  { file: 'public/apple-touch-icon-180x180.png', size: 180 },
]

for (const { file, size } of sizes) {
  const svgBuf = Buffer.from(
    svgBig.replace('width="512" height="512"', `width="${size}" height="${size}"`)
  )
  await sharp(svgBuf).resize(size, size).png().toFile(file)
  console.log(`✓ ${file}`)
}
