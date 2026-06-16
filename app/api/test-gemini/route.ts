import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs/promises";

export const runtime = "nodejs";

async function testGeminiText() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY not set in .env" };
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say hello in one word.");
    return { ok: true, response: result.response.text().trim() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function testFaceModels() {
  const modelDir = path.join(process.cwd(), "src", "models", "face-api-models");
  const required = [
    "ssd_mobilenetv1_model-weights_manifest.json",
    "face_landmark_68_model-weights_manifest.json",
    "face_recognition_model-weights_manifest.json",
  ];
  const missing: string[] = [];
  for (const f of required) {
    try { await fs.access(path.join(modelDir, f)); }
    catch { missing.push(f); }
  }
  return missing.length === 0
    ? { ok: true, response: "All 3 model manifest files present" }
    : { ok: false, error: `Missing model files: ${missing.join(", ")}` };
}

export async function GET() {
  const [geminiSearch, geminiDamage, faceModels] = await Promise.all([
    testGeminiText(),
    testGeminiText(), // same API/key, damage detection uses same model
    testFaceModels(),
  ]);

  return NextResponse.json({
    "ai-search (Gemini)":    geminiSearch,
    "damage-detection (Gemini)": geminiDamage,
    "face-verification (local TensorFlow)": faceModels,
  });
}
