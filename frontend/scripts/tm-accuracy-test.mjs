/**
 * Accuracy probe for EcoBin bottle/can model (local images preferred).
 *
 * Usage:
 *   npm run test:model
 *   node scripts/tm-accuracy-test.mjs
 *   node scripts/tm-accuracy-test.mjs --dir path/to/images   (optional custom folder)
 *
 * Expect folders under --dir OR scripts/_data/dataset-resized:
 *   plastic/  → PLASTIC_BOTTLE
 *   metal/    → CAN
 *   glass|cardboard|paper|trash/ → INVALID
 */
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODEL_DIR = join(__dirname, '..', 'public', 'models', 'ecobin-bottle-can');
const DEFAULT_DATA = join(__dirname, '_data', 'dataset-resized');
const CONFIDENCE = Number(process.env.TM_CONFIDENCE || 0.8);
const PER_CLASS = Number(process.env.TM_SAMPLES || 50);
const LABELS = ['PLASTIC_BOTTLE', 'CAN', 'INVALID'];

const CLASS_DIRS = [
  { expect: 'PLASTIC_BOTTLE', dirs: ['plastic', 'bottle', 'PLASTIC_BOTTLE'] },
  { expect: 'CAN', dirs: ['metal', 'can', 'CAN'] },
  { expect: 'INVALID', dirs: ['glass', 'cardboard', 'paper', 'trash', 'invalid', 'INVALID'] },
];

function parseArgs() {
  const idx = process.argv.indexOf('--dir');
  return { dataRoot: idx >= 0 ? process.argv[idx + 1] : DEFAULT_DATA };
}

function listImages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp|bmp)$/i.test(f))
    .map((f) => join(dir, f));
}

function pickSamples(files, n) {
  const shuffled = [...files].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function collectSamples(dataRoot) {
  const samples = [];
  for (const set of CLASS_DIRS) {
    let files = [];
    for (const d of set.dirs) {
      files.push(...listImages(join(dataRoot, d)));
    }
    for (const file of pickSamples(files, PER_CLASS)) {
      samples.push({ id: `${set.expect}/${basename(file)}`, expect: set.expect, file });
    }
  }
  return samples;
}

async function loadStack() {
  const meta = JSON.parse(readFileSync(join(MODEL_DIR, 'metadata.json'), 'utf8'));
  const modelJson = JSON.parse(readFileSync(join(MODEL_DIR, 'model.json'), 'utf8'));
  const weightsBin = readFileSync(join(MODEL_DIR, 'weights.bin'));
  const net = await mobilenet.load({ version: 2, alpha: 0.5 });
  const head = await tf.loadLayersModel(
    tf.io.fromMemory({
      modelTopology: modelJson.modelTopology,
      weightSpecs: modelJson.weightsManifest[0].weights,
      weightData: weightsBin.buffer.slice(weightsBin.byteOffset, weightsBin.byteOffset + weightsBin.byteLength),
    }),
  );
  return { net, head, labels: meta.labels ?? LABELS };
}

async function predict(stack, file) {
  const { data } = await sharp(file).rotate().resize(224, 224, { fit: 'cover' }).flatten().raw().toBuffer({ resolveWithObject: true });
  const img = tf.tensor3d(new Uint8Array(data), [224, 224, 3]);
  const logits = tf.tidy(() => stack.head.predict(stack.net.infer(img, true).reshape([1, -1])));
  const probs = await logits.data();
  img.dispose();
  logits.dispose();
  let top = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[top]) top = i;
  const label = stack.labels[top];
  const confidence = Math.round(probs[top] * 1000) / 10;
  const accepted = (label === 'PLASTIC_BOTTLE' || label === 'CAN') && probs[top] > CONFIDENCE;
  return { label, confidence, accepted, probs: Object.fromEntries(stack.labels.map((l, i) => [l, Math.round(probs[i] * 1000) / 10])) };
}

async function main() {
  const { dataRoot } = parseArgs();
  if (!existsSync(dataRoot)) {
    console.error(`ไม่พบโฟลเดอร์รูป: ${dataRoot}`);
    console.error('วางรูปใน scripts/_data/dataset-resized/{plastic,metal,glass,...} หรือส่ง --dir <path>');
    process.exit(1);
  }

  console.log(`Model: ${MODEL_DIR}`);
  console.log(`Data:  ${dataRoot}`);
  console.log(`Gate:  confidence > ${CONFIDENCE * 100}%`);
  console.log(`Samples/class: ${PER_CLASS}\n`);

  await tf.setBackend('cpu');
  const stack = await loadStack();
  const samples = collectSamples(dataRoot);
  if (samples.length === 0) {
    console.error('ไม่พบไฟล์รูปในโฟลเดอร์ข้อมูล');
    process.exit(1);
  }

  const results = [];
  for (const s of samples) {
    try {
      const p = await predict(stack, s.file);
      const correct = p.label === s.expect;
      // SIT: bottle/can must be correct + accepted; invalid must NOT be accepted
      const sitOk =
        s.expect === 'INVALID'
          ? !p.accepted
          : correct && p.accepted;
      results.push({ id: s.id, expect: s.expect, ...p, correct, sitOk });
      const mark = sitOk ? 'PASS' : correct ? 'MAP-OK' : 'MISS';
      console.log(`[${mark}] ${s.id} → ${p.label} ${p.confidence}% (expect ${s.expect})`);
    } catch (e) {
      results.push({ id: s.id, expect: s.expect, error: e.message, correct: false, sitOk: false });
      console.log(`[ERR] ${s.id}: ${e.message}`);
    }
  }

  const by = (expect) => results.filter((r) => r.expect === expect && !r.error);
  const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

  const bottles = by('PLASTIC_BOTTLE');
  const cans = by('CAN');
  const invalids = by('INVALID');
  const all = results.filter((r) => !r.error);

  const summary = {
    threshold: `>${CONFIDENCE * 100}%`,
    tested: all.length,
    overallLabelAccuracy: pct(all.filter((r) => r.correct).length, all.length),
    sitPassRate: pct(all.filter((r) => r.sitOk).length, all.length),
    plasticBottle: {
      tested: bottles.length,
      labelAccuracy: pct(bottles.filter((r) => r.correct).length, bottles.length),
      sitAccept: pct(bottles.filter((r) => r.sitOk).length, bottles.length),
      avgConfidenceWhenCorrect: avg(bottles.filter((r) => r.correct).map((r) => r.confidence)),
    },
    can: {
      tested: cans.length,
      labelAccuracy: pct(cans.filter((r) => r.correct).length, cans.length),
      sitAccept: pct(cans.filter((r) => r.sitOk).length, cans.length),
      avgConfidenceWhenCorrect: avg(cans.filter((r) => r.correct).map((r) => r.confidence)),
    },
    invalid: {
      tested: invalids.length,
      labelAccuracy: pct(invalids.filter((r) => r.correct).length, invalids.length),
      correctlyRejected: pct(invalids.filter((r) => r.sitOk).length, invalids.length),
      falseAccept: invalids.filter((r) => r.accepted).length,
    },
  };

  console.log('\n========== SUMMARY ==========');
  console.log(JSON.stringify(summary, null, 2));

  const outDir = join(__dirname, '_tm-accuracy-out');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify({ summary, results }, null, 2));
  console.log(`\nSaved: ${join(outDir, 'summary.json')}`);
}

function avg(nums) {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
