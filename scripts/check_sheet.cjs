const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('public/assets/gugugaga_sheet.png');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

console.log(`Sheet Size: ${width}x${height}`);

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
console.log(`Decompressed size: ${raw.length} bytes`);

const bgR = raw[1];
const bgG = raw[2];
const bgB = raw[3];
console.log(`Background color at (0,0): rgb(${bgR}, ${bgG}, ${bgB})`);
