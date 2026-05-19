const fs = require("node:fs/promises");
const path = require("node:path");

const MODEL_DIR = path.join(process.cwd(), "src", "models", "face-api-models");
const MODEL_BASE_URL =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

const FILES = [
  "ssd_mobilenetv1_model-weights_manifest.json",
  "ssd_mobilenetv1_model-shard1",
  "ssd_mobilenetv1_model-shard2",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
];

async function downloadFile(fileName) {
  const sourceUrl = `${MODEL_BASE_URL}/${fileName}`;
  const targetPath = path.join(MODEL_DIR, fileName);

  console.log(`[download:face-models] Downloading ${fileName}`);
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to download ${fileName} (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(targetPath, Buffer.from(arrayBuffer));
  console.log(`[download:face-models] Saved ${targetPath}`);
}

async function main() {
  await fs.mkdir(MODEL_DIR, { recursive: true });

  for (const fileName of FILES) {
    await downloadFile(fileName);
  }

  console.log("[download:face-models] All face-api models downloaded successfully");
}

main().catch((error) => {
  console.error("[download:face-models] Download failed", error);
  process.exitCode = 1;
});
