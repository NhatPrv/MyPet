const fs = require('fs');
const zlib = require('zlib');

// Tái tạo hàm crc32
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const buf = fs.readFileSync('public/assets/gugugaga_sheet.png');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

let offset = 8;
const idatChunks = [];
while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IDAT') {
    idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
  }
  offset += 12 + len;
}

const idatCombined = Buffer.concat(idatChunks);
const raw = zlib.inflateSync(idatCombined);

// Tách màu nền kem: rgb(248, 241, 225) -> Alpha = 0
const rowSize = 1 + width * 4;
const outRaw = Buffer.alloc(raw.length);

const bgR = 248;
const bgG = 241;
const bgB = 225;

for (let y = 0; y < height; y++) {
  const rowOffset = y * rowSize;
  outRaw[rowOffset] = raw[rowOffset]; // Filter byte

  for (let x = 0; x < width; x++) {
    const px = rowOffset + 1 + x * 4;
    const r = raw[px];
    const g = raw[px + 1];
    const b = raw[px + 2];
    const a = raw[px + 3];

    // Tính khoảng cách màu tới màu nền kem
    const dist = Math.sqrt(
      (r - bgR) * (r - bgR) +
      (g - bgG) * (g - bgG) +
      (b - bgB) * (b - bgB)
    );

    outRaw[px] = r;
    outRaw[px + 1] = g;
    outRaw[px + 2] = b;

    if (dist < 14) {
      // Trong suốt hoàn toàn
      outRaw[px + 3] = 0;
    } else if (dist < 32) {
      // Khử răng cưa viền mềm (Anti-aliasing)
      const alphaFactor = (dist - 14) / (32 - 14);
      outRaw[px + 3] = Math.round(a * alphaFactor);
    } else {
      outRaw[px + 3] = a;
    }
  }
}

const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(width, 0);
ihdrData.writeUInt32BE(height, 4);
ihdrData[8] = 8;
ihdrData[9] = 6;
ihdrData[10] = 0;
ihdrData[11] = 0;
ihdrData[12] = 0;
const ihdr = createChunk('IHDR', ihdrData);
const idat = createChunk('IDAT', zlib.deflateSync(outRaw));
const iend = createChunk('IEND', Buffer.alloc(0));

const outPng = Buffer.concat([header, ihdr, idat, iend]);
fs.writeFileSync('public/assets/gugugaga_sheet_transparent.png', outPng);
console.log('Created public/assets/gugugaga_sheet_transparent.png successfully.');
