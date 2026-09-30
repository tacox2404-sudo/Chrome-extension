// Draws the frog icon with plain math and writes PNGs, so no image tools are needed.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function pixel(u, v) {
  // u, v in 0..1. Returns [r,g,b,a]
  const rr = 0.22; // corner radius
  const dx = Math.max(Math.abs(u - 0.5) - (0.5 - rr), 0);
  const dy = Math.max(Math.abs(v - 0.5) - (0.5 - rr), 0);
  if (Math.hypot(dx, dy) > rr) return [0, 0, 0, 0];
  let col = mix([255, 77, 141], [123, 47, 247], (u + v) / 2); // pink to purple
  const inCircle = (cx, cy, r) => Math.hypot(u - cx, v - cy) <= r;
  if (inCircle(0.5, 0.58, 0.32)) col = [107, 214, 90]; // head
  if (inCircle(0.33, 0.33, 0.13) || inCircle(0.67, 0.33, 0.13)) col = [107, 214, 90]; // eye bumps
  if (inCircle(0.33, 0.33, 0.085) || inCircle(0.67, 0.33, 0.085)) col = [255, 255, 255];
  if (inCircle(0.34, 0.34, 0.04) || inCircle(0.66, 0.34, 0.04)) col = [30, 20, 60];
  // smile: arc below the eyes
  const d = Math.hypot(u - 0.5, v - 0.5);
  if (v > 0.6 && Math.abs(d - 0.2) < 0.02 && Math.abs(u - 0.5) < 0.17) col = [30, 20, 60];
  return [...col.map(Math.round), 255];
}

function png(size) {
  const ss = 4; // supersampling
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const p = pixel((x + (sx + 0.5) / ss) / size, (y + (sy + 0.5) / ss) / size);
        acc[0] += p[0] * p[3]; acc[1] += p[1] * p[3]; acc[2] += p[2] * p[3]; acc[3] += p[3];
      }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      const a = acc[3];
      raw[o] = a ? Math.round(acc[0] / a) : 0;
      raw[o + 1] = a ? Math.round(acc[1] / a) : 0;
      raw[o + 2] = a ? Math.round(acc[2] / a) : 0;
      raw[o + 3] = Math.round(a / (ss * ss));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("extension/icons", { recursive: true });
for (const s of [16, 48, 128]) writeFileSync(`extension/icons/icon${s}.png`, png(s));
console.log("icons written");
