import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export type TermsDocument = {
  /** Exact Terms markdown. The content hash is SHA-256 of these UTF-8 bytes. */
  markdown: string;
  /** Effective date printed on the Terms, e.g. "September 25, 2026". */
  version: string;
  /** Lowercase hex SHA-256 of `markdown`. */
  contentHash: string;
};

function isEnoent(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'ENOENT';
}

function readOptional(file: string): string | null {
  try {
    return readFileSync(file, 'utf8');
  } catch (err) {
    if (isEnoent(err)) return null;
    throw err;
  }
}

/**
 * The marketing site renders `src/legal/terms.md`. The portal deployment
 * carries `content/terms.md` (a copy of that file) because the Vercel project
 * root is `portal/`. When both are readable they must match.
 */
export function loadTermsMarkdown(): string {
  const bundled = readOptional(path.join(process.cwd(), 'content', 'terms.md'));
  const canonical = readOptional(path.join(process.cwd(), '..', 'src', 'legal', 'terms.md'));
  if (bundled != null && canonical != null && bundled !== canonical) {
    throw new Error(
      'portal/content/terms.md does not match src/legal/terms.md. Copy the Terms file before accepting signups.',
    );
  }
  const text = canonical ?? bundled;
  if (text == null) throw new Error('Terms markdown was not found.');
  return text;
}

export function parseTermsVersion(markdown: string): string {
  const front = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (front) {
    const fromYaml = front[1].match(/^effective:\s*["']?(.+?)["']?\s*$/m);
    if (fromYaml?.[1]) return cleanVersion(fromYaml[1]);
  }
  const italic = markdown.match(/^\*Effective\s+([^*]+?)\s*\*/m);
  if (!italic?.[1]) throw new Error('Terms are missing an effective date.');
  return cleanVersion(italic[1]);
}

function cleanVersion(raw: string): string {
  const version = raw.trim();
  if (!version || version.length > 80) throw new Error('Terms effective date is not usable.');
  if (!/^[A-Za-z0-9 ,.'/-]+$/.test(version)) throw new Error('Terms effective date is not usable.');
  return version;
}

export function hashTermsMarkdown(markdown: string): string {
  return createHash('sha256').update(markdown, 'utf8').digest('hex');
}

let cached: TermsDocument | null = null;

export function getTermsDocument(): TermsDocument {
  if (cached) return cached;
  const markdown = loadTermsMarkdown();
  cached = {
    markdown,
    version: parseTermsVersion(markdown),
    contentHash: hashTermsMarkdown(markdown),
  };
  return cached;
}
