import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, colorFn) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = colorFn(x, y, width, height);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Generate stylized TabletopNexus icon pixel buffer
function renderIconPixel(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;
  const dx = nx - cx;
  const dy = ny - cy;
  const distCenter = Math.sqrt(dx * dx + dy * dy);

  // Background gradient: Amber (top-left) to Rose/Pink (bottom-right)
  const gradT = (nx + ny) * 0.5;
  let bgR = Math.round(245 + (225 - 245) * gradT);
  let bgG = Math.round(158 + (29 - 158) * gradT);
  let bgB = Math.round(11 + (72 - 11) * gradT);

  // For non-maskable icons, apply rounded squircle shape
  if (!isMaskable) {
    const cornerRadius = 0.22;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax > 0.5 - cornerRadius && ay > 0.5 - cornerRadius) {
      const cdx = ax - (0.5 - cornerRadius);
      const cdy = ay - (0.5 - cornerRadius);
      if (cdx * cdx + cdy * cdy > cornerRadius * cornerRadius) {
        return [0, 0, 0, 0]; // Transparent outside squircle
      }
    }
  }

  // Safe scale for maskable (central 80%) vs regular
  const scale = isMaskable ? 0.72 : 0.88;
  const sx = (dx / scale) + 0.5;
  const sy = (dy / scale) + 0.5;

  // Dice isometric faces
  // Top Face diamond: center at (0.5, 0.42), width 0.38, height 0.22
  const topDx = Math.abs(sx - 0.5);
  const topDy = Math.abs(sy - 0.42);
  const inTopFace = (topDx / 0.19) + (topDy / 0.11) <= 1.0;

  // Left Face polygon
  const inLeftFace =
    sx >= 0.31 && sx <= 0.5 &&
    sy >= 0.42 && sy <= 0.74 &&
    ((0.5 - sx) / 0.19) * 0.11 + 0.42 <= sy &&
    sy <= ((0.5 - sx) / 0.19) * 0.11 + 0.63;

  // Right Face polygon
  const inRightFace =
    sx >= 0.5 && sx <= 0.69 &&
    sy >= 0.42 && sy <= 0.74 &&
    ((sx - 0.5) / 0.19) * 0.11 + 0.42 <= sy &&
    sy <= ((sx - 0.5) / 0.19) * 0.11 + 0.63;

  // Center dice pip
  const pipDist = Math.sqrt((sx - 0.5) ** 2 + ((sy - 0.42) / 0.6) ** 2);
  if (inTopFace && pipDist < 0.035) {
    return [225, 29, 72, 255]; // Rose-600 pip
  }

  if (inTopFace) {
    return [254, 243, 199, 255]; // Warm cream top
  }
  if (inLeftFace) {
    return [251, 191, 36, 255]; // Amber-400 left
  }
  if (inRightFace) {
    return [217, 119, 6, 255]; // Amber-600 right
  }

  // Inner subtle white glow ring
  if (distCenter >= 0.32 && distCenter <= 0.37) {
    const glowAlpha = 0.15 * (1 - Math.abs(distCenter - 0.345) / 0.025);
    bgR = Math.min(255, bgR + Math.round(255 * glowAlpha));
    bgG = Math.min(255, bgG + Math.round(255 * glowAlpha));
    bgB = Math.min(255, bgB + Math.round(255 * glowAlpha));
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. pwa-192x192.png
const pwa192 = createPng(192, 192, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

// 2. pwa-512x512.png
const pwa512 = createPng(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

// 3. pwa-maskable-512x512.png
const pwaMaskable = createPng(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);

// 4. apple-touch-icon.png (180x180)
const appleTouch = createPng(180, 180, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

console.log('Successfully generated all PWA icons: 192x192, 512x512, maskable 512x512, apple-touch-icon 180x180');
