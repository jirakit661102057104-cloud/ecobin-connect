/**
 * SIT accuracy probe for EcoBin bottle/can model.
 */
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODEL_DIR = join(__dirname, '..', 'public', 'models', 'ecobin-bottle-can');
const CONFIDENCE = Number(process.env.TM_CONFIDENCE || 0.8);
const LABELS = ['PLASTIC_BOTTLE', 'CAN', 'INVALID'];

const SAMPLES = [
  { id: 'bottle-1', expect: 'PLASTIC_BOTTLE', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80' },
  { id: 'bottle-2', expect: 'PLASTIC_BOTTLE', url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80' },
  { id: 'bottle-3', expect: 'PLASTIC_BOTTLE', url: 'https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'bottle-4', expect: 'PLASTIC_BOTTLE', url: 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'bottle-5', expect: 'PLASTIC_BOTTLE', url: 'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'can-1', expect: 'CAN', url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&auto=format&fit=crop&q=80' },
  { id: 'can-2', expect: 'CAN', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80' },
  { id: 'can-3', expect: 'CAN', url: 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'can-4', expect: 'CAN', url: 'https://images.pexels.com/photos/5501165/pexels-photo-5501165.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'can-5', expect: 'CAN', url: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

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

async function predict(stack, buf) {
  const { data } = await sharp(buf).rotate().resize(224, 224, { fit: 'cover' }).flatten().raw().toBuffer({ resolveWithObject: true });
  const img = tf.tensor3d(new Uint8Array(data), [224, 224, 3]);
  const logits = tf.tidy(() => stack.head.predict(stack.net.infer(img, true).reshape([1, -1])));
  const probs = await logits.data();
  img.dispose(); logits.dispose();
  let top = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[top]) top = i;
  const label = stack.labels[top];
  const confidence = Math.round(probs[top] * 1000) / 10;
  const accepted = (label === 'PLASTIC_BOTTLE' || label === 'CAN') && probs[top] > CONFIDENCE;
  return { label, confidence, accepted };
}

async function main() {
  await tf.setBackend('cpu');
  const stack = await loadStack();
  const results = [];
  for (const s of SAMPLES) {
    try {
      const res = await fetch(s.url, { headers: { 'User-Agent': 'EcoBinTest/1.0' } });
      const buf = Buffer.from(await res.arrayBuffer());
      const p = await predict(stack, buf);
      const correct = p.label === s.expect;
      const sitOk = correct && s.expect !== 'INVALID' && p.accepted;
      results.push({ ...s, ...p, correct, sitOk });
      console.log(`[${correct ? 'OK' : 'MISS'}${sitOk ? ' SIT' : ''}] ${s.id} → ${p.label} ${p.confidence}%`);
    } catch (e) {
      results.push({ ...s, error: e.message, correct: false, sitOk: false });
      console.log(`[ERR] ${s.id}: ${e.message}`);
    }
  }
  const ok = results.filter((r) => r.correct);
  const sit = results.filter((r) => r.sitOk);
  const bottles = results.filter((r) => r.expect === 'PLASTIC_BOTTLE' && !r.error);
  const cans = results.filter((r) => r.expect === 'CAN' && !r.error);
  const summary = {
    threshold: `>${CONFIDENCE * 100}%`,
    webMapAccuracy: Math.round((ok.length / results.length) * 1000) / 10,
    webSitAccept: Math.round((sit.length / results.length) * 1000) / 10,
    bottleMap: Math.round((bottles.filter((r) => r.correct).length / Math.max(bottles.length, 1)) * 1000) / 10,
    canMap: Math.round((cans.filter((r) => r.correct).length / Math.max(cans.length, 1)) * 1000) / 10,
  };
  console.log('\n', JSON.stringify(summary, null, 2));
  mkdirSync(join(__dirname, '_tm-accuracy-out'), { recursive: true });
  writeFileSync(join(__dirname, '_tm-accuracy-out', 'summary.json'), JSON.stringify({ summary, results }, null, 2));
}

main().catch(console.error);
