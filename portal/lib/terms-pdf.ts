import { existsSync } from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const INK = '#17302e';
const MUTED = '#5a6e69';
const RULE = '#e4ddd0';
const PAPER = '#f6f2e8';
const GUAYAQUIL = 'America/Guayaquil';

const FONT = {
  regular: 'Serif',
  bold: 'Serif-Bold',
  italic: 'Serif-Italic',
  boldItalic: 'Serif-BoldItalic',
} as const;

export type TermsPdfInput = {
  markdown: string;
  signedName: string;
  email: string;
  planSummary: string;
  acceptedAt: string;
  termsVersion: string;
  termsContentHash: string;
};

export type TermsPdfFile = {
  filename: string;
  bytes: Buffer;
};

type Run = { text: string; bold?: boolean; italic?: boolean };

type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; runs: Run[] }
  | { type: 'list'; ordered: boolean; items: Run[][] };

function oneLine(value: string): string {
  return value.replace(/[\r\n\u0000]/g, ' ').replace(/\s+/g, ' ').trim();
}

function fontFile(name: string): string {
  const candidates = [
    path.join(process.cwd(), 'assets', 'fonts', name),
    path.join(process.cwd(), 'portal', 'assets', 'fonts', name),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Terms PDF font was not found (${name}).`);
}

function registerFonts(doc: PDFKit.PDFDocument): void {
  doc.registerFont(FONT.regular, fontFile('LiberationSerif-Regular.ttf'));
  doc.registerFont(FONT.bold, fontFile('LiberationSerif-Bold.ttf'));
  doc.registerFont(FONT.italic, fontFile('LiberationSerif-Italic.ttf'));
  doc.registerFont(FONT.boldItalic, fontFile('LiberationSerif-BoldItalic.ttf'));
}

function fontFor(run: Run): string {
  if (run.bold && run.italic) return FONT.boldItalic;
  if (run.bold) return FONT.bold;
  if (run.italic) return FONT.italic;
  return FONT.regular;
}

/** `September 26, 2026` → `September-26-2026`. */
export function termsDateSlug(version: string): string {
  const slug = oneLine(version).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'accepted';
}

/** Last word of the typed name, ASCII, safe for a filename. */
export function termsLastNameSlug(signedName: string): string {
  const parts = oneLine(signedName).split(' ').filter(Boolean);
  const last = parts[parts.length - 1] || 'Client';
  const ascii = last.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const slug = ascii.replace(/[^A-Za-z0-9-]+/g, '').replace(/^-+|-+$/g, '');
  return slug || 'Client';
}

export function termsPdfFilename(input: Pick<TermsPdfInput, 'signedName' | 'termsVersion'>): string {
  return `Teleforce-Terms-${termsDateSlug(input.termsVersion)}-${termsLastNameSlug(input.signedName)}.pdf`;
}

function parseInline(text: string): Run[] {
  const runs: Run[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) runs.push({ text: text.slice(last, index) });
    if (match[1] != null) runs.push({ text: match[1], bold: true });
    else if (match[2] != null) runs.push({ text: match[2], italic: true });
    last = index + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs.filter((run) => run.text.length > 0);
}

function stripFrontMatter(markdown: string): string {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

/**
 * The Terms file is headings, paragraphs, bold clause numbers, italics, and
 * (when present) bullet or numbered lists. This covers that subset.
 */
export function parseTermsMarkdown(markdown: string): { effectiveLine: string; blocks: Block[] } {
  const lines = stripFrontMatter(markdown).replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let effectiveLine = '';
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(' ').replace(/\s+/g, ' ').trim();
    paragraph = [];
    if (!text) return;
    const runs = parseInline(text);
    const only = runs.length === 1 && runs[0].italic && !runs[0].bold ? runs[0].text.trim() : '';
    if (!effectiveLine && /^Effective\s+/i.test(only)) {
      effectiveLine = only;
      return;
    }
    blocks.push({ type: 'paragraph', runs });
  };

  let index = 0;
  while (index < lines.length) {
    const trimmed = lines[index].trim();
    if (!trimmed) {
      flushParagraph();
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', text: heading[2].replace(/\s+/g, ' ').trim() });
      index += 1;
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if ((bullet || ordered) && paragraph.length === 0) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const items: Run[][] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        const item = isOrdered ? /^\d+[.)]\s+(.+)$/.exec(current) : /^[-*]\s+(.+)$/.exec(current);
        if (!item) break;
        items.push(parseInline(item[1].trim()));
        index += 1;
      }
      blocks.push({ type: 'list', ordered: isOrdered, items });
      continue;
    }

    paragraph.push(trimmed);
    index += 1;
  }
  flushParagraph();
  return { effectiveLine, blocks };
}

function contentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function ensureSpace(doc: PDFKit.PDFDocument, points: number): void {
  const limit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + points > limit) doc.addPage();
}

function drawRuns(doc: PDFKit.PDFDocument, runs: Run[], width: number, size: number): void {
  const visible = runs.filter((run) => run.text.length > 0);
  if (visible.length === 0) return;
  visible.forEach((run, index) => {
    doc.font(fontFor(run)).fontSize(size).fillColor(INK);
    doc.text(run.text, {
      width,
      continued: index < visible.length - 1,
      lineGap: 3,
    });
  });
}

function drawHeading(doc: PDFKit.PDFDocument, text: string): void {
  ensureSpace(doc, 52);
  doc.x = doc.page.margins.left;
  doc.y += 12;
  doc.font(FONT.bold).fontSize(13.5).fillColor(INK);
  doc.text(text, { width: contentWidth(doc), lineGap: 1 });
  doc.y += 6;
  doc.x = doc.page.margins.left;
}

function drawParagraph(doc: PDFKit.PDFDocument, runs: Run[]): void {
  ensureSpace(doc, 32);
  doc.x = doc.page.margins.left;
  drawRuns(doc, runs, contentWidth(doc), 11);
  doc.y += 8;
  doc.x = doc.page.margins.left;
}

function drawList(doc: PDFKit.PDFDocument, ordered: boolean, items: Run[][]): void {
  const left = doc.page.margins.left;
  const markerWidth = 22;
  const textWidth = contentWidth(doc) - markerWidth - 4;
  items.forEach((item, itemIndex) => {
    ensureSpace(doc, 28);
    const y = doc.y;
    const marker = ordered ? `${itemIndex + 1}.` : '•';
    doc.font(FONT.regular).fontSize(11).fillColor(INK);
    doc.text(marker, left + 2, y, { width: markerWidth, lineBreak: false });
    doc.x = left + markerWidth + 4;
    doc.y = y;
    drawRuns(doc, item, textWidth, 11);
    doc.y += 4;
    doc.x = left;
  });
  doc.y += 6;
  doc.x = left;
}

function formatWhen(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return oneLine(iso) || 'Not available';
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(date);
  return timeZone === 'UTC' ? `${formatted} (UTC)` : `${formatted} (${timeZone})`;
}

type RecordRow = { label: string; value: string };

function recordRows(input: TermsPdfInput): RecordRow[] {
  return [
    { label: 'Signed name', value: oneLine(input.signedName) || 'Not available' },
    { label: 'Email', value: oneLine(input.email) || 'Not available' },
    { label: 'Plan', value: oneLine(input.planSummary) || 'Not available' },
    { label: 'Accepted (Guayaquil)', value: formatWhen(input.acceptedAt, GUAYAQUIL) },
    { label: 'Accepted (UTC)', value: formatWhen(input.acceptedAt, 'UTC') },
    { label: 'Terms version', value: oneLine(input.termsVersion) || 'Not available' },
    { label: 'Terms hash', value: oneLine(input.termsContentHash) || 'Not available' },
  ];
}

function drawAcceptanceRecord(doc: PDFKit.PDFDocument, rows: RecordRow[]): void {
  const left = doc.page.margins.left;
  const width = contentWidth(doc);
  const labelWidth = 148;
  const valueWidth = width - 28 - labelWidth;
  const caption = 'SHA-256 of the Terms text stored with this acceptance. This is not a hash of the PDF file.';

  doc.font(FONT.regular).fontSize(10);
  const rowHeights = rows.map((row) => Math.max(13, doc.heightOfString(row.value, { width: valueWidth, lineGap: 1 })));
  doc.font(FONT.italic).fontSize(8);
  const captionHeight = doc.heightOfString(caption, { width: width - 24, lineGap: 1 });
  const boxHeight = 16 + 14 + rowHeights.reduce((sum, height) => sum + height + 6, 0) + 8 + captionHeight + 12;

  ensureSpace(doc, boxHeight + 8);
  const top = doc.y;
  doc.save();
  doc.roundedRect(left, top, width, boxHeight, 6).lineWidth(0.8).fillAndStroke(PAPER, RULE);
  doc.restore();

  let y = top + 12;
  doc.font(FONT.regular).fontSize(9).fillColor(MUTED);
  doc.text('ACCEPTANCE RECORD', left + 12, y, {
    width: width - 24,
    characterSpacing: 1.1,
    lineBreak: false,
  });
  y += 18;

  rows.forEach((row, index) => {
    doc.font(FONT.regular).fontSize(10).fillColor(MUTED);
    doc.text(row.label, left + 12, y, { width: labelWidth, lineBreak: false });
    doc.font(FONT.regular).fontSize(10).fillColor(INK);
    doc.text(row.value, left + 12 + labelWidth, y, { width: valueWidth, lineGap: 1 });
    y += rowHeights[index] + 6;
  });

  doc.font(FONT.italic).fontSize(8).fillColor(MUTED);
  doc.text(caption, left + 12, y, { width: width - 24, lineGap: 1 });
  doc.x = left;
  doc.y = top + boxHeight + 16;
}

function drawTitle(doc: PDFKit.PDFDocument, effectiveLine: string, version: string): void {
  doc.x = doc.page.margins.left;
  doc.font(FONT.bold).fontSize(22).fillColor(INK);
  doc.text('Terms & Conditions', { width: contentWidth(doc) });
  doc.y += 2;
  doc.font(FONT.italic).fontSize(11).fillColor(MUTED);
  doc.text(effectiveLine || `Effective ${oneLine(version)}`, { width: contentWidth(doc) });
  const ruleY = doc.y + 8;
  doc.moveTo(doc.page.margins.left, ruleY)
    .lineTo(doc.page.margins.left + 72, ruleY)
    .strokeColor('#f2a82b')
    .lineWidth(2)
    .stroke();
  doc.x = doc.page.margins.left;
  doc.y = ruleY + 16;
}

function stampPages(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(range.start + index);
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const left = doc.page.margins.left;
    const width = contentWidth(doc);
    const headerY = 40;

    doc.font(FONT.regular).fontSize(9).fillColor(MUTED);
    doc.text('TELEFORCE', left, headerY, {
      width: width * 0.45,
      characterSpacing: 1.5,
      lineBreak: false,
    });
    doc.font(FONT.regular).fontSize(9).fillColor(MUTED);
    doc.text('Terms & Conditions', left, headerY, {
      width,
      align: 'right',
      lineBreak: false,
    });

    const ruleY = 56;
    doc.moveTo(left, ruleY).lineTo(left + width, ruleY).strokeColor(RULE).lineWidth(0.6).stroke();

    const footerY = doc.page.height - 40;
    doc.moveTo(left, footerY - 10)
      .lineTo(left + width, footerY - 10)
      .strokeColor(RULE)
      .lineWidth(0.6)
      .stroke();
    doc.font(FONT.regular).fontSize(9).fillColor(MUTED);
    doc.text(`Page ${index + 1} of ${range.count}`, left, footerY, {
      width,
      align: 'right',
      lineBreak: false,
    });
    doc.page.margins.bottom = savedBottom;
  }
}

function renderDocument(doc: PDFKit.PDFDocument, input: TermsPdfInput): void {
  registerFonts(doc);
  const { effectiveLine, blocks } = parseTermsMarkdown(input.markdown);
  drawTitle(doc, effectiveLine, input.termsVersion);
  drawAcceptanceRecord(doc, recordRows(input));

  for (const block of blocks) {
    if (block.type === 'heading') drawHeading(doc, block.text);
    else if (block.type === 'list') drawList(doc, block.ordered, block.items);
    else drawParagraph(doc, block.runs);
  }
  stampPages(doc);
}

/** Formatted PDF of the accepted Terms. Throws if a font or the document cannot be built. */
export function buildTermsPdf(input: TermsPdfInput): Promise<TermsPdfFile> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 72, bottom: 64, left: 64, right: 64 },
      bufferPages: true,
      info: {
        Title: 'Teleforce Terms & Conditions',
        Author: 'Teleforce',
        Subject: `Accepted ${oneLine(input.termsVersion)}`,
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => {
      const bytes = Buffer.concat(chunks);
      if (bytes.length < 8 || bytes.subarray(0, 5).toString('utf8') !== '%PDF-') {
        reject(new Error('Terms PDF was empty.'));
        return;
      }
      resolve({ filename: termsPdfFilename(input), bytes });
    });
    try {
      renderDocument(doc, input);
      doc.end();
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Terms PDF failed.'));
    }
  });
}
