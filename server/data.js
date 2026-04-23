import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '..', 'data', 'scorecard.json');

async function ensureDir() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
}

export async function readData() {
  try {
    await ensureDir();
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function writeData(data) {
  await ensureDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}
