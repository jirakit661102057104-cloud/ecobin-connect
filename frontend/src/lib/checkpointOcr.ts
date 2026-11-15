import { CHECKPOINT_WORDS } from './scanCheckpoint';

export type CheckpointOcrResult = {
  rawText: string;
  found: string[];
  missing: string[];
  complete: boolean;
  /** 0–100 based on how many required words were found */
  score: number;
};

function normalizeOcrText(text: string) {
  return (text || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True if each required word appears as a whole token in OCR text. */
export function matchCheckpointWords(
  ocrText: string,
  required: readonly string[] = CHECKPOINT_WORDS,
): CheckpointOcrResult {
  const normalized = normalizeOcrText(ocrText);
  const tokens = new Set(normalized.split(' ').filter(Boolean));
  // Also allow concatenated forms like "SAVECFO"
  const compact = normalized.replace(/\s+/g, '');

  const found: string[] = [];
  const missing: string[] = [];
  for (const word of required) {
    const w = word.toUpperCase();
    if (tokens.has(w) || compact.includes(w)) found.push(w);
    else missing.push(w);
  }
  const score = Math.round((found.length / Math.max(required.length, 1)) * 100);
  return {
    rawText: ocrText,
    found,
    missing,
    complete: missing.length === 0,
    score,
  };
}

let workerPromise: Promise<import('tesseract.js').Worker> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: () => {
          /* quiet */
        },
      });
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ',
      });
      return worker;
    })();
  }
  return workerPromise;
}

/** OCR an image (data URL or canvas) and check for SAVE + CFO. */
export async function ocrCheckpointFromImage(
  source: HTMLCanvasElement | string,
  required: readonly string[] = CHECKPOINT_WORDS,
): Promise<CheckpointOcrResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(source);
  return matchCheckpointWords(data.text || '', required);
}

export async function terminateCheckpointOcr() {
  if (!workerPromise) return;
  try {
    const w = await workerPromise;
    await w.terminate();
  } catch {
    /* ignore */
  }
  workerPromise = null;
}
