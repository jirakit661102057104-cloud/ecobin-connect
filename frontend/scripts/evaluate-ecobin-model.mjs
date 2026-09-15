/**
 * Evaluate EcoBin local model on TrashNet folders (plastic, metal, invalid mix).
 */
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import sharp from 'sharp';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODEL_DIR = join(__dirname, '..', 'public', 'models', 'ecobin-bottle-can');
const DATA = join(__dirname, '_data', 'dataset-resized');
const THRESHOLD = Number(process.env.TM_CONFIDENCE || 0.8);
const LABELS = ['PLASTIC_BOTTLE', 'CAN', 'INVALID'];
const SAMPLES_PER = 40;

const SETS = [
  { expect: 'PLASTIC_BOTTLE', dirs: ['plastic'] },
  { expect: 'CAN', dirs: ['metal'] },
  { expect: 'INVALID', dirs: ['glass', 'cardboard', 'paper', 'trash'] },
];

function mapLabel(name) {
  const n = name.toUpperCase();
  if (n === 'PLASTIC_BOTTLE') return 'PLASTIC_BOTTLE';
  if (n === 'CAN') return 'CAN';
  return 'INVALID';
}

async function predict(net, head, labels, file) {
  const { data } = await sharp(file).rotate().resize(224, 224, { fit: 'cover' }).flatten().raw().toBuffer({ resolveWithObject: true });
  const img = tf.tensor3d(new Uint8Array(data), [224, 224, 3]);
  const logits = tf.tidy(() => head.predict(net.infer(img, true).reshape([1, -1])));
  const probs = await logits.data();
  img.dispose(); logits.dispose();
  let top = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[top]) top = i;
  const label = labels[top];
  const conf = probs[top];
  return { label, conf, accepted: (label === 'PLASTIC_BOTTLE' || label === 'CAN') && conf > THRESHOLD && mapLabel(label) === mapLabel(label) };
}

async function main() {
  await tf.setBackend('cpu');
  const meta = JSON.parse(readFileSync(join(MODEL_DIR, 'metadata.json'), 'utf8'));
  const labels = meta.labels;
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

  let total = 0, mapOk = 0, sitOk = 0, falseAccept = 0;
  const perClass = {};

  for (const set of SETS) {
    let files = [];
    for (const d of set.dirs) {
      const dir = join(DATA, d);
      files.push(...readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).map((f) => join(dir, f)));
    }
    files = files.sort(() => Math.random() - 0.5).slice(0, SAMPLES_PER);
    let cMap = 0, cSit = 0;
    for (const f of files) {
      const r = await predict(net, head, labels, f);
      total++;
      const ok = r.label === set.expect;
      if (ok) { mapOk++; cMap++; }
      if (ok && (set.expect === 'INVALID' ? !r.accepted : r.accepted && r.conf > THRESHOLD)) {
        if (set.expect !== 'INVALID') sitOk++;
        cSit++;
      } else if (set.expect !== 'INVALID' && ok && r.conf > THRESHOLD) {
        sitOk++;
      } else if (set.expect !== 'INVALID' && !ok && r.accepted) {
        falseAccept++;
      }
      if (set.expect !== 'INVALID' && ok && r.conf > THRESHOLD) cSit++;
    }
    const sitDenom = set.expect === 'INVALID' ? cMap : files.length;
    perClass[set.expect] = {
      tested: files.length,
      mapAccuracy: Math.round((cMap / files.length) * 1000) / 10,
      sitPassRate: set.expect === 'INVALID'
        ? Math.round(((files.length - falseAccept) / files.length) * 1000) / 10
        : Math.round((cSit / files.length) * 1000) / 10,
    };
  }

  const summary = {
    model: MODEL_DIR,
    threshold: `>${THRESHOLD * 100}%`,
    overallMapAccuracy: Math.round((mapOk / total) * 1000) / 10,
    bottleCanSitAccept: perClass.PLASTIC_BOTTLE?.sitPassRate,
    canSitAccept: perClass.CAN?.sitPassRate,
    perClass,
    falseAccept,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(console.error);
