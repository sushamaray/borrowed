import { GoogleGenerativeAI } from "@google/generative-ai";

export type DamageVerdict = "damaged" | "no_damage" | "unclear";

export interface DamageDetectionResult {
  verdict: DamageVerdict;
  confidence: number; // 0–100
  notes: string;
}

const FALLBACK: DamageDetectionResult = {
  verdict: "unclear",
  confidence: 0,
  notes: "AI analysis could not be completed",
};

const PROMPT = `You are a professional item damage inspector. You are given two photos of the same borrowed item:
- Image 1: condition BEFORE borrowing (taken by the lender at handoff)
- Image 2: condition AFTER return (taken by the borrower at return)

IMPORTANT: The photos may differ in lighting, angle, background, and distance. These differences are NOT damage. Focus ONLY on physical changes to the item itself such as:
- New scratches, scuffs, or gouges
- Dents, bends, or deformation
- Cracks, chips, or breaks
- Tears, holes, or fraying
- Stains, burns, or discoloration directly on the item
- Missing parts or accessories

Respond with ONLY valid JSON (no markdown, no explanation):
{"verdict":"damaged","confidence":85,"notes":"Visible scratch on the left side not present in before photo"}

verdict must be exactly one of: "damaged", "no_damage", "unclear"
- "damaged": you can clearly see NEW physical damage on the item not present before
- "no_damage": the item appears in the same or better physical condition (ignore lighting/angle)
- "unclear": images are too blurry, too dark, the item is not visible in both, or the same item cannot be confirmed
confidence is an integer 0-100 representing how certain you are of the verdict.`;

export async function detectDamage(
  beforeBuffer: Buffer,
  beforeMimeType: string,
  afterBuffer: Buffer,
  afterMimeType: string,
): Promise<DamageDetectionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return FALLBACK;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      { inlineData: { mimeType: beforeMimeType, data: beforeBuffer.toString("base64") } },
      { inlineData: { mimeType: afterMimeType, data: afterBuffer.toString("base64") } },
      { text: PROMPT },
    ]);

    const raw = result.response
      .text()
      .trim()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    const parsed = JSON.parse(raw) as {
      verdict?: string;
      confidence?: number;
      notes?: string;
    };

    const verdict = (
      ["damaged", "no_damage", "unclear"].includes(parsed.verdict ?? "")
        ? parsed.verdict
        : "unclear"
    ) as DamageVerdict;

    const confidence = Math.min(
      100,
      Math.max(0, Math.round(parsed.confidence ?? 0)),
    );
    const notes =
      typeof parsed.notes === "string" && parsed.notes.length > 0
        ? parsed.notes
        : "No additional notes";

    return { verdict, confidence, notes };
  } catch (err) {
    console.error("[damage-detection] Gemini API error:", err);
    return FALLBACK;
  }
}
