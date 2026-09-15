export interface RealtimeClassification {
  className: string;
  confidence: number;
  valid: boolean;
  plasticTypeTH: string;
  plasticTypeEN: string;
  bottleCount: number;
}

type TeachableModel = {
  predict: (
    input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    flipped?: boolean,
  ) => Promise<Array<{ className: string; probability: number }>>;
};

type EcoBinStack = {
  net: import('@tensorflow-models/mobilenet').MobileNet;
  head: import('@tensorflow/tfjs').LayersModel;
  labels: string[];
};

const INVALID_LABELS = [
  'invalid',
  'reject',
  'trash',
  'garbage',
  'background',
  'other',
  'non bottle',
  'not bottle',
  'not recyclable',
  'ไม่ผ่าน',
  'ขยะทั่วไป',
  'ไม่ใช่ขวด',
];

let tmModelPromise: Promise<TeachableModel> | null = null;
let ecobinStackPromise: Promise<EcoBinStack> | null = null;
let ecobinStackBase = '';

export function classificationFromLabel(
  className: string,
  probability: number,
): RealtimeClassification {
  const normalized = className.trim().toLowerCase();
  const isDirectBottle = normalized === 'plastic_bottle' || normalized === 'plastic bottle';
  const isDirectCan = normalized === 'can';
  const isDirectInvalid = normalized === 'invalid' || INVALID_LABELS.some((label) => normalized.includes(label));
  const isHDPE = normalized.includes('hdpe');
  const isPET = normalized.includes('pet') && !normalized.includes('hdpe');
  const isPlasticBottle =
    isDirectBottle ||
    isPET ||
    isHDPE ||
    normalized === 'plastic: recyclable' ||
    normalized.includes('plastic_bottle') ||
    normalized.includes('plastic bottle') ||
    normalized.includes('ขวดพลาสติก');
  const isCan =
    isDirectCan ||
    normalized === 'metal: recyclable' ||
    /(^|[\s_-])can(s)?($|[\s_-])/.test(normalized) ||
    normalized.includes('aluminium') ||
    normalized.includes('aluminum') ||
    normalized.includes('กระป๋อง');
  const explicitlyInvalid = isDirectInvalid && !isPlasticBottle && !isCan;
  const countMatch = normalized.match(/(\d+)\s*(?:ขวด|bottles?|กระป๋อง|cans?)/i);

  return {
    className,
    confidence: Math.round(probability * 1000) / 10,
    valid: !explicitlyInvalid && (isPlasticBottle || isCan),
    plasticTypeTH: isCan
      ? 'กระป๋องอะลูมิเนียม'
      : isPlasticBottle
        ? 'ขวดพลาสติก'
        : 'ไม่ผ่าน',
    plasticTypeEN: isCan
      ? 'CAN'
      : isPlasticBottle
        ? 'PLASTIC_BOTTLE'
        : 'INVALID',
    bottleCount: countMatch ? Math.max(1, Number(countMatch[1])) : 1,
  };
}

async function loadModelMetadata(base: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${base}/metadata.json`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function loadEcoBinStack(base: string): Promise<EcoBinStack> {
  if (ecobinStackPromise && ecobinStackBase === base) return ecobinStackPromise;
  ecobinStackBase = base;
  ecobinStackPromise = (async () => {
    const meta = await loadModelMetadata(base);
    const labels = Array.isArray(meta?.labels)
      ? (meta.labels as string[])
      : ['PLASTIC_BOTTLE', 'CAN', 'INVALID'];
    const [tf, mobilenet] = await Promise.all([
      import('@tensorflow/tfjs'),
      import('@tensorflow-models/mobilenet'),
    ]);
    await tf.ready();
    const [net, head] = await Promise.all([
      mobilenet.load({ version: 2, alpha: 0.5 }),
      tf.loadLayersModel(`${base}/model.json`),
    ]);
    return { net, head, labels };
  })().catch((error) => {
    ecobinStackPromise = null;
    throw error;
  });
  return ecobinStackPromise;
}

export async function loadTeachableModel(modelUrl: string): Promise<TeachableModel> {
  const base = modelUrl.replace(/\/+$/, '');
  if (!base) {
    throw new Error('Teachable Machine model URL is missing');
  }
  const meta = await loadModelMetadata(base);
  if (meta?.inference === 'mobilenet-embedding-head') {
    throw new Error('EcoBin model uses classifyImageDataUrl directly');
  }
  if (!tmModelPromise) {
    tmModelPromise = (async () => {
      const tmImage = await import('@teachablemachine/image');
      return (await tmImage.load(`${base}/model.json`, `${base}/metadata.json`)) as TeachableModel;
    })().catch((error) => {
      tmModelPromise = null;
      throw error;
    });
  }
  return tmModelPromise;
}

async function classifyWithEcoBin(base: string, image: HTMLImageElement): Promise<RealtimeClassification> {
  const stack = await loadEcoBinStack(base);
  const tf = await import('@tensorflow/tfjs');
  const logits = tf.tidy(() => {
    const pixels = tf.browser.fromPixels(image);
    const resized = tf.image.resizeBilinear(pixels, [224, 224]).toInt();
    const embedding = stack.net.infer(resized, true).reshape([1, -1]);
    return stack.head.predict(embedding) as import('@tensorflow/tfjs').Tensor;
  });
  const probs = await logits.data();
  logits.dispose();

  let topIdx = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[topIdx]) topIdx = i;
  }
  const className = stack.labels[topIdx] ?? 'INVALID';
  return classificationFromLabel(className, probs[topIdx]);
}

export async function classifyImageDataUrl(
  modelUrl: string,
  imageDataUrl: string,
): Promise<RealtimeClassification> {
  const base = modelUrl.replace(/\/+$/, '');
  const image = await loadImageElement(imageDataUrl);
  const meta = await loadModelMetadata(base);

  if (meta?.inference === 'mobilenet-embedding-head') {
    return classifyWithEcoBin(base, image);
  }

  const model = await loadTeachableModel(base);
  const predictions = await model.predict(image, false);
  const top = [...predictions].sort((a, b) => b.probability - a.probability)[0];
  if (!top) {
    return classificationFromLabel('INVALID', 0);
  }
  return classificationFromLabel(top.className, top.probability);
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load image for classification'));
    image.src = src;
  });
}
