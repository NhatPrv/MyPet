const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('public/assets/gugugaga_sheet_transparent.png');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

let offset = 8;
const idatChunks = [];
while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IDAT') idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
  offset += 12 + len;
}

const raw = zlib.inflateSync(Buffer.concat(idatChunks));
const rowSize = 1 + width * 4;

function getBoundingBox(minX, minY, maxX, maxY) {
  let realMinX = maxX, realMinY = maxY, realMaxX = minX, realMaxY = minY;
  let hasPixels = false;

  for (let y = minY; y <= maxY; y++) {
    const rowOffset = y * rowSize;
    for (let x = minX; x <= maxX; x++) {
      const a = raw[rowOffset + 1 + x * 4 + 3];
      if (a > 30) {
        hasPixels = true;
        if (x < realMinX) realMinX = x;
        if (x > realMaxX) realMaxX = x;
        if (y < realMinY) realMinY = y;
        if (y > realMaxY) realMaxY = y;
      }
    }
  }

  if (!hasPixels) return null;
  return {
    x: realMinX,
    y: realMinY,
    w: realMaxX - realMinX + 1,
    h: realMaxY - realMinY + 1
  };
}

// Bounding box approximation zones:
// Row 1: Turnaround (x: 0..650, y: 50..260), Idle (x: 650..1024, y: 50..260)
console.log('Turnaround 1 (Front):', getBoundingBox(30, 60, 160, 240));
console.log('Turnaround 2 (3/4):', getBoundingBox(165, 60, 280, 240));
console.log('Turnaround 3 (Side):', getBoundingBox(285, 60, 400, 240));
console.log('Turnaround 4 (3/4 Back):', getBoundingBox(410, 60, 530, 240));
console.log('Turnaround 5 (Back):', getBoundingBox(535, 60, 660, 240));

console.log('Idle 1 (Front wave):', getBoundingBox(700, 60, 830, 240));
console.log('Idle 2 (Back):', getBoundingBox(840, 60, 960, 240));

// Row 2: Walk (x: 0..460, y: 350..550), Chase Butterfly (x: 460..1024, y: 350..550)
console.log('Walk 1:', getBoundingBox(30, 360, 140, 520));
console.log('Walk 2:', getBoundingBox(145, 360, 250, 520));
console.log('Walk 3:', getBoundingBox(255, 360, 360, 520));
console.log('Walk 4:', getBoundingBox(365, 360, 465, 520));

console.log('Chase 1 (Crouch):', getBoundingBox(470, 440, 580, 570));
console.log('Chase 2 (Run):', getBoundingBox(585, 430, 705, 570));
console.log('Chase 3 (Jump):', getBoundingBox(710, 370, 825, 560));
console.log('Chase 4 (Celebrate):', getBoundingBox(835, 410, 970, 570));

// Row 3: Sleep (x: 0..300, y: 650..760), Dragged (x: 300..650, y: 650..760), Alert (x: 650..1024, y: 650..760)
console.log('Sleep:', getBoundingBox(50, 670, 280, 760));
console.log('Dragged 1 (Dizzy):', getBoundingBox(320, 670, 480, 760));
console.log('Dragged 2 (Scared):', getBoundingBox(485, 670, 640, 760));
console.log('Alert 1 (Startled):', getBoundingBox(690, 650, 825, 760));
console.log('Alert 2 (Happy wave):', getBoundingBox(830, 650, 970, 760));
