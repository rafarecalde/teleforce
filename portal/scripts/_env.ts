import { readFileSync } from 'node:fs';

// Tiny .env.local loader so the scripts can run with `tsx` without extra deps.
export function loadEnv(file = '.env.local'): void {
  try {
    const txt = readFileSync(file, 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2].trim().replace(/^["']|["']$/g, '');
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    // No .env.local — fall back to ambient environment.
  }
}
