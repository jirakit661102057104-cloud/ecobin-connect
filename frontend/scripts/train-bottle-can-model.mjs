/**
 * Train EcoBin SIT classifier (fast path): PLASTIC_BOTTLE | CAN | INVALID
 */
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = join(__dirname, '_data', 'dataset-resized');
const OUT_DIR = join(__dirname, '..', 'public', 'models', 'ecobin-bottle-can');
const IMAGE_SIZE = 224;
const MAX_PER_CLASS = 200;
const LABELS = ['PLASTIC_BOTTLE', 'CAN', 'INVALID'];

const CLASS_DIRS = {
  PLASTIC_BOTTLE: ['plastic'],
  CAN: ['metal'],
  INVALID: ['glass', 'cardboard', 'paper', 'trash'],
};

function listImages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => join(dir, f));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadRgbTensor(path) {
  const { data } = await sharp(path).rotate().resize(IMAGE_SIZE, IMAGE_SIZE, { fit: 'cover' }).flatten().raw().toBuffer({ resolveWithObject: true });
  return tf.tensor3d(new Uint8Array(data), [IMAGE_SIZE, IMAGE_SIZE, 3]);
}

async function embeddingsForFiles(net, files) {
  const vectors = [];
  for (let i = 0; i < files.length; i++) {
    const img = await loadRgbTensor(files[i]);
    const emb = await tf.tidy(() => net.infer(img, true).reshape([1, -1]));
    vectors.push(Array.from(await emb.data()));
    emb.dispose();
    img.dispose();
  }
  return vectors;
}

function gatherFiles() {
  const byClass = { PLASTIC_BOTTLE: [], CAN: [], INVALID: [] };
  for (const [label, dirs] of Object.entries(CLASS_DIRS)) {
    const files = [];
    for (const d of dirs) files.push(...listImages(join(DATA_ROOT, d)));
    byClass[label] = shuffle(files).slice(0, MAX_PER_CLASS);
  }
  return byClass;
}

async function saveHeadModel(model, metadata, summary) {
  mkdirSync(OUT_DIR, { recursive: true });
  await model.save(
    tf.io.withSaveHandler(async (artifacts) => {
      writeFileSync(
        join(OUT_DIR, 'model.json'),
        JSON.stringify({
          modelTopology: artifacts.modelTopology,
          format: 'layers-model',
          generatedBy: 'EcoBinBottleCanSIT',
          weightsManifest: [{ paths: ['./weights.bin'], weights: artifacts.weightSpecs }],
        }),
      );
      const weightData = artifacts.weightData instanceof ArrayBuffer ? Buffer.from(artifacts.weightData) : Buffer.from(artifacts.weightData[0]);
      writeFileSync(join(OUT_DIR, 'weights.bin'), weightData);
      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
    }),
  );
  writeFileSync(join(OUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));
  writeFileSync(join(OUT_DIR, 'train-summary.json'), JSON.stringify(summary, null, 2));
}

async function main() {
  await tf.setBackend('cpu');
  await tf.ready();
  console.log('Loading MobileNet...');
  const net = await mobilenet.load({ version: 2, alpha: 0.5 });
  const byClass = gatherFiles();
  for (const l of LABELS) console.log(`${l}: ${byClass[l].length}`);

  const xs = [];
  const ys = [];
  for (let ci = 0; ci < LABELS.length; ci++) {
    console.log(`Embedding ${LABELS[ci]}...`);
    const vecs = await embeddingsForFiles(net, byClass[LABELS[ci]]);
    for (const v of vecs) { xs.push(v); ys.push(ci); }
  }

  const pairs = shuffle(xs.map((x, i) => ({ x, y: ys[i] })));
  const split = Math.floor(pairs.length * 0.85);
  const train = pairs.slice(0, split);
  const val = pairs.slice(split);

  const xTrain = tf.tensor2d(train.map((p) => p.x));
  const yTrain = tf.oneHot(tf.tensor1d(train.map((p) => p.y), 'int32'), 3);
  const xVal = tf.tensor2d(val.map((p) => p.x));
  const yVal = tf.oneHot(tf.tensor1d(val.map((p) => p.y), 'int32'), 3);

  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [train[0].x.length], units: 128, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.25 }),
      tf.layers.dense({ units: 64, activation: 'relu' }),
      tf.layers.dense({ units: 3, activation: 'softmax' }),
    ],
  });
  model.compile({ optimizer: tf.train.adam(0.001), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

  let bestAcc = 0;
  let bestW = null;
  for (let e = 0; e < 45; e++) {
    const h = await model.fit(xTrain, yTrain, { epochs: 1, batchSize: 32, validationData: [xVal, yVal], verbose: 0 });
    const va = h.history.val_acc?.[0] ?? h.history.val_accuracy?.[0] ?? 0;
    if (va > bestAcc) { bestAcc = va; bestW = model.getWeights().map((w) => w.clone()); }
  }
  if (bestW) model.setWeights(bestW);

  const preds = model.predict(xVal);
  const pArr = await preds.argMax(-1).data();
  const tArr = await yVal.argMax(-1).data();
  let correct = 0;
  const confMat = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < tArr.length; i++) {
    confMat[tArr[i]][pArr[i]]++;
    if (tArr[i] === pArr[i]) correct++;
  }
  const valAcc = correct / tArr.length;
  const perClassRecall = LABELS.map((label, i) => {
    const row = confMat[i].reduce((a, b) => a + b, 0);
    return { label, recall: row ? confMat[i][i] / row : 0 };
  });

  console.log('Val accuracy:', (valAcc * 100).toFixed(1) + '%');
  console.log('Confusion:', confMat);

  await saveHeadModel(
    model,
    {
      labels: LABELS,
      modelName: 'EcoBinBottleCanSIT',
      imageSize: IMAGE_SIZE,
      embedding: 'mobilenet-v2-0.5',
      inference: 'mobilenet-embedding-head',
      threshold: 0.8,
      trainedAt: new Date().toISOString(),
      dataset: 'TrashNet (plastic→PLASTIC_BOTTLE, metal→CAN, others→INVALID)',
      source: 'https://github.com/garythung/trashnet',
      validationAccuracy: Math.round(valAcc * 1000) / 10,
      perClassRecall: Object.fromEntries(perClassRecall.map((p) => [p.label, Math.round(p.recall * 1000) / 10])),
    },
    { valAcc, confMat, perClassRecall, bestAcc },
  );
  console.log('Saved', OUT_DIR);

  xTrain.dispose(); yTrain.dispose(); xVal.dispose(); yVal.dispose(); preds.dispose();
}

main().catch((e) => { console.error(e); process.exit(1); });
