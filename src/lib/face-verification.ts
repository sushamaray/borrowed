import * as faceapi from "face-api.js";
import { Canvas, Image, ImageData, createCanvas, loadImage } from "canvas";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

type VerificationStatus = "verified" | "rejected";
type ImageSource = string | Uint8Array;

const PROJECT_ROOT = path.resolve(/*turbopackIgnore: true*/ process.cwd());
const MODEL_DIR = path.join(PROJECT_ROOT, "src", "models", "face-api-models");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const TEMP_DIR = path.resolve(os.tmpdir());
const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;
const REMOTE_FETCH_TIMEOUT_MS = 15_000;

let backendReadyPromise: Promise<void> | null = null;
let modelsLoadedPromise: Promise<void> | null = null;
let canvasPatched = false;

function isRemoteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isFileUrl(value: string) {
  return /^file:\/\//i.test(value);
}

function isBufferLike(value: ImageSource): value is Uint8Array {
  return value instanceof Uint8Array;
}

function isPathWithin(parentDir: string, childPath: string) {
  const relativePath = path.relative(parentDir, childPath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function sanitizeLocalPath(inputPath: string) {
  const normalizedInput = inputPath.trim();

  if (!normalizedInput) {
    throw new Error("Image path is required");
  }

  const candidatePath = isFileUrl(normalizedInput)
    ? new URL(normalizedInput)
    : normalizedInput;
  const resolvedPath =
    candidatePath instanceof URL
      ? path.normalize(candidatePath.pathname)
      : path.resolve(PROJECT_ROOT, candidatePath);

  const normalizedResolvedPath = path.normalize(resolvedPath);
  const allowedRoots = [PROJECT_ROOT, PUBLIC_DIR, TEMP_DIR];

  if (!allowedRoots.some((root) => isPathWithin(root, normalizedResolvedPath))) {
    throw new Error("Image path is outside the allowed directories");
  }

  return normalizedResolvedPath;
}

async function ensureReadableFile(filePath: string) {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`Image not found: ${filePath}`);
  }
}

async function readStreamToBuffer(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw new Error(`Remote image exceeds ${maxBytes} bytes`);
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

async function downloadRemoteImage(imageUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Image not found: ${imageUrl}`);
    }

    const contentLength = response.headers.get("content-length");
    if (
      contentLength &&
      Number.parseInt(contentLength, 10) > MAX_REMOTE_IMAGE_BYTES
    ) {
      throw new Error(`Remote image exceeds ${MAX_REMOTE_IMAGE_BYTES} bytes`);
    }

    if (!response.body) {
      throw new Error(`Failed to load image: ${imageUrl}`);
    }

    return await readStreamToBuffer(response.body, MAX_REMOTE_IMAGE_BYTES);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Timed out while downloading image: ${imageUrl}`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveImageToBuffer(source: ImageSource) {
  if (isBufferLike(source)) {
    if (source.byteLength === 0) {
      throw new Error("Failed to load image: empty image buffer");
    }

    return Buffer.from(source);
  }

  if (isRemoteUrl(source)) {
    return downloadRemoteImage(source);
  }

  const localPath = sanitizeLocalPath(source);
  await ensureReadableFile(localPath);
  return fs.readFile(localPath);
}

async function ensureTensorflowBackend() {
  if (!backendReadyPromise) {
    backendReadyPromise = (async () => {
      console.log("[face-verification] Initializing TensorFlow backend");

      try {
        const loadModule = new Function(
          "specifier",
          "return import(specifier)",
        ) as (specifier: string) => Promise<unknown>;
        await loadModule("@tensorflow/tfjs-node");
        console.log("[face-verification] Using @tensorflow/tfjs-node backend");
      } catch (error) {
        console.warn(
          "[face-verification] @tensorflow/tfjs-node unavailable; falling back to default TensorFlow backend",
          error,
        );
        await import("@tensorflow/tfjs");
      }
    })();
  }

  return backendReadyPromise;
}

async function ensureModelsExist() {
  const requiredFiles = [
    "ssd_mobilenetv1_model-weights_manifest.json",
    "face_landmark_68_model-weights_manifest.json",
    "face_recognition_model-weights_manifest.json",
  ];

  for (const fileName of requiredFiles) {
    const fullPath = path.join(MODEL_DIR, fileName);
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error(
        `Model loading failure: missing ${fileName}. Run "npm run download:face-models".`,
      );
    }
  }
}

async function ensureModelsLoaded() {
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = (async () => {
      console.log("[face-verification] Loading face-api models");
      await ensureTensorflowBackend();
      await ensureModelsExist();

      if (!canvasPatched) {
        faceapi.env.setEnv(faceapi.env.createNodejsEnv());
        faceapi.env.monkeyPatch({
          Canvas: Canvas as unknown as typeof HTMLCanvasElement,
          Image: Image as unknown as typeof HTMLImageElement,
          ImageData: ImageData as unknown as typeof globalThis.ImageData,
        });
        canvasPatched = true;
      }

      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_DIR),
          faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_DIR),
          faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_DIR),
        ]);
      } catch (error) {
        console.error("[face-verification] Failed to load models", error);
        throw new Error("Model loading failure");
      }

      console.log("[face-verification] Models loaded successfully");
    })();
  }

  return modelsLoadedPromise;
}

function createImageCanvas(image: Awaited<ReturnType<typeof loadImage>>) {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, image.width, image.height);
  return canvas;
}

function selectPrimaryDetection<
  TDetection extends { detection: { box: { width: number; height: number } } },
>(detections: TDetection[]) {
  if (detections.length === 1) {
    return detections[0];
  }

  return detections.reduce((largestDetection, currentDetection) => {
    const largestArea =
      largestDetection.detection.box.width * largestDetection.detection.box.height;
    const currentArea =
      currentDetection.detection.box.width * currentDetection.detection.box.height;

    return currentArea > largestArea ? currentDetection : largestDetection;
  });
}

async function getFaceDescriptor(source: ImageSource, label: string) {
  await ensureModelsLoaded();

  const imageBuffer = await resolveImageToBuffer(source);

  let image;
  try {
    image = await loadImage(imageBuffer);
  } catch (error) {
    console.error(`[face-verification] Failed to load ${label} image`, error);
    throw new Error(`Failed to load ${label} image`);
  }

  const canvas = createImageCanvas(image);
  const detections = await faceapi
    .detectAllFaces(canvas as unknown as HTMLCanvasElement)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) {
    throw new Error(`No face detected in ${label} image`);
  }

  if (detections.length > 1) {
    console.warn("[face-verification] Multiple faces detected; using largest face", {
      image: label,
      count: detections.length,
    });
  }

  console.log("[face-verification] Face detection successful", {
    image: label,
    count: detections.length,
  });

  return selectPrimaryDetection(detections).descriptor;
}

function calculateDistance(first: Float32Array, second: Float32Array) {
  let sum = 0;

  for (let index = 0; index < first.length; index += 1) {
    const delta = first[index] - second[index];
    sum += delta * delta;
  }

  return Math.sqrt(sum);
}

function buildVerificationResult(distance: number): {
  score: number;
  distance: number;
  status: VerificationStatus;
} {
  const score = Math.max(0, Math.min(100, (1 - distance) * 100));
  const status: VerificationStatus = score >= 70 ? "verified" : "rejected";

  return {
    score,
    distance,
    status,
  };
}

async function verifyFaceSources(frontImage: ImageSource, selfieImage: ImageSource) {
  console.log("[face-verification] Verification started");

  const [frontDescriptor, selfieDescriptor] = await Promise.all([
    getFaceDescriptor(frontImage, "front"),
    getFaceDescriptor(selfieImage, "selfie"),
  ]);
  const distance = calculateDistance(frontDescriptor, selfieDescriptor);
  const result = buildVerificationResult(distance);

  console.log("[face-verification] Similarity score generated", {
    distance: result.distance,
    score: result.score,
    status: result.status,
  });

  return result;
}

export async function verifyFaces(frontImagePath: string, selfieImagePath: string) {
  return verifyFaceSources(frontImagePath, selfieImagePath);
}

export async function verifyFaceBuffers(
  frontImage: Uint8Array,
  selfieImage: Uint8Array,
) {
  return verifyFaceSources(frontImage, selfieImage);
}
