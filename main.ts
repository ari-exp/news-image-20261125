// The World in One Page — 25 November 2026.
// Node 22, standard library only: copies the entry.png beside this file to
// ${MAKEFUN_OUTPUT_DIR:-/output}/entry.png, after validating the source PNG.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024; // 1 MiB
const WIDTH = 1024;
const HEIGHT = 1024;

function validate(path: string): void {
  let bytes: Buffer;
  try {
    bytes = readFileSync(path);
  } catch (err) {
    console.error(`cannot read source PNG at ${path}: ${(err as Error).message}`);
    process.exit(1);
  }
  if (bytes.length === 0) {
    console.error('source PNG is empty');
    process.exit(1);
  }
  if (bytes.length > MAX_BYTES) {
    console.error(`source PNG is too large: ${bytes.length} bytes (max ${MAX_BYTES})`);
    process.exit(1);
  }
  if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    console.error('source PNG is not a valid PNG (bad magic bytes: expected 89 50 4E 47 0D 0A 1A 0A)');
    process.exit(1);
  }
  // First chunk must be IHDR; width/height are the first two 32-bit big-endian
  // integers in its data, which sit at offsets 16 and 20.
  const type = bytes.toString('ascii', 12, 16);
  if (type !== 'IHDR') {
    console.error(`source PNG is not a valid PNG (first chunk is ${type}, expected IHDR)`);
    process.exit(1);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== WIDTH || height !== HEIGHT) {
    console.error(`source PNG must be ${WIDTH}x${HEIGHT}, got ${width}x${height}`);
    process.exit(1);
  }
}

const source = fileURLToPath(new URL('./entry.png', import.meta.url));
validate(source);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
copyFileSync(source, join(outDir, 'entry.png'));
