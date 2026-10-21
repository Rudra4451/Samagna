const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 implementation for PNG chunks
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([t, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, t, data, crcBuf]);
}

function encodePng(width, height, rgbaBuffer) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  const stride = width * 4 + 1;
  const filtered = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    filtered[y * stride] = 0; // Filter 0
    rgbaBuffer.copy(filtered, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = makeChunk('IDAT', zlib.deflateSync(filtered, { level: 6 }));
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Bitmap drawing utilities
function createBuffer(w, h, bg = [250, 246, 238, 255]) {
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    buf[i * 4] = bg[0];
    buf[i * 4 + 1] = bg[1];
    buf[i * 4 + 2] = bg[2];
    buf[i * 4 + 3] = bg[3];
  }
  return buf;
}

function drawRect(buf, w, h, x, y, rw, rh, color) {
  for (let py = Math.max(0, y); py < Math.min(h, y + rh); py++) {
    for (let px = Math.max(0, x); px < Math.min(w, x + rw); px++) {
      const idx = (py * w + px) * 4;
      buf[idx] = color[0];
      buf[idx + 1] = color[1];
      buf[idx + 2] = color[2];
      buf[idx + 3] = color[3];
    }
  }
}

function drawBorder(buf, w, h, x, y, rw, rh, color) {
  drawRect(buf, w, h, x, y, rw, 1, color);
  drawRect(buf, w, h, x, y + rh - 1, rw, 1, color);
  drawRect(buf, w, h, x, y, 1, rh, color);
  drawRect(buf, w, h, x + rw - 1, y, 1, rh, color);
}

// Generate the 6 step slides
const STEPS = [
  {
    step: 1,
    name: 'step1_collector_pickup',
    act: 'ACT 1 · 0:30–1:30',
    title: 'Mobile Collector Pickup · Sunita Soren',
    meta: '100.0 kg Dried Mahua Flowers · ₹42/kg · Queued Offline Sync',
    accentColor: [178, 78, 46, 255], // #B24E2E
    badgeText: 'QUEUED TO SYNC',
  },
  {
    step: 2,
    name: 'step2_collection_receipt',
    act: 'ACT 1 · 1:00–1:30',
    title: 'Collection Receipt · Batch #BS-402',
    meta: 'Gross: ₹4,200.00 · Weight: 100.0 kg · LABHA Direct Benefit Transfer',
    accentColor: [63, 107, 62, 255], // #3F6B3E
    badgeText: 'PAID (SIMULATED)',
  },
  {
    step: 3,
    name: 'step3_bag_tag_qr',
    act: 'ACT 1 · 1:15–1:30',
    title: 'Sack Stencil Bag Tag & Deterministic QR',
    meta: 'Short Code: BS-402 · Waybill: WB-OD-24-099 · Vehicle: OD-11-AB-1234',
    accentColor: [31, 26, 20, 255], // #1F1A14
    badgeText: 'SEAL OD-MBJ-KRN-402',
  },
  {
    step: 4,
    name: 'step4_warehouse_reweigh',
    act: 'ACT 2 · 1:30–2:00',
    title: 'Baripada Central Depôt Re-Weigh',
    meta: 'Arrival Gross: 96.5 kg · Tare: 1.5 kg · Net: 95.0 kg (-5.0 kg loss)',
    accentColor: [168, 100, 27, 255], // #A8641B
    badgeText: 'TOLERANCE 1.5%',
  },
  {
    step: 5,
    name: 'step5_discrepancy_quarantine',
    act: 'ACT 2 · 2:00–2:30',
    title: 'Shrinkage Excess Deficit & Quarantine Vault',
    meta: 'Allowable Loss: 1.5 kg · Excess Deficit: -3.5 kg · Case #DISC-402',
    accentColor: [142, 47, 38, 255], // #8E2F26
    badgeText: 'QUARANTINED',
  },
  {
    step: 6,
    name: 'step6_audit_timeline',
    act: 'ACT 3 · 2:30–3:00',
    title: 'Custody Audit Trail & Non-Punitive Defense',
    meta: 'SHA-256 Checksum Verified · Historical #BS-395 Precedent Applied',
    accentColor: [46, 78, 94, 255], // #2E4E5E
    badgeText: 'AUDIT VERIFIED',
  },
];

const outDir = path.join(__dirname, '..', 'public', 'demo', 'fallback');
fs.mkdirSync(outDir, { recursive: true });

const W = 960;
const H = 640;

STEPS.forEach((info) => {
  const buf = createBuffer(W, H, [250, 246, 238, 255]); // Warm paper ground
  const rule = [228, 219, 201, 255]; // #E4DBC9
  const ink = [31, 26, 20, 255];
  const muted = [107, 95, 82, 255];
  const sunken = [242, 235, 221, 255];

  // Outer structural frame (1px rule)
  drawBorder(buf, W, H, 24, 24, W - 48, H - 48, rule);

  // Top header bar
  drawRect(buf, W, H, 25, 25, W - 50, 48, sunken);
  drawRect(buf, W, H, 25, 73, W - 50, 1, rule);

  // Act tag pill
  drawRect(buf, W, H, 44, 38, 140, 22, ink);

  // Main UI Card container
  drawRect(buf, W, H, 44, 96, W - 88, H - 168, [255, 255, 255, 255]);
  drawBorder(buf, W, H, 44, 96, W - 88, H - 168, rule);

  // Card header line
  drawRect(buf, W, H, 45, 160, W - 90, 1, rule);

  // Status badge on card
  drawRect(buf, W, H, W - 220, 116, 150, 28, info.accentColor);

  // Card content mock elements
  drawRect(buf, W, H, 68, 190, 360, 40, sunken);
  drawRect(buf, W, H, 68, 244, 360, 120, sunken);
  drawBorder(buf, W, H, 68, 244, 360, 120, rule);

  drawRect(buf, W, H, 460, 190, W - 528, 174, sunken);
  drawBorder(buf, W, H, 460, 190, W - 528, 174, rule);

  // Bottom action bar on card
  drawRect(buf, W, H, 45, H - 144, W - 90, 1, rule);
  drawRect(buf, W, H, W - 240, H - 128, 170, 36, info.accentColor);

  // Footer bar on slide
  drawRect(buf, W, H, 25, H - 56, W - 50, 31, sunken);
  drawRect(buf, W, H, 25, H - 57, W - 50, 1, rule);

  const png = encodePng(W, H, buf);

  // Save as both 1.png and step1_collector_pickup.png
  const file1 = path.join(outDir, `${info.step}.png`);
  const file2 = path.join(outDir, `${info.name}.png`);
  fs.writeFileSync(file1, png);
  fs.writeFileSync(file2, png);

  console.log(`Generated fallback slide ${info.step}: ${file1} (${png.length} bytes)`);
});

console.log('Successfully generated all 6 deterministic 2x fallback screenshot slides.');
