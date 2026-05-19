import { GoogleGenerativeAI } from "@google/generative-ai";

export const AI_CATEGORIES = [
  "Photography & Film",
  "Music & Audio",
  "Tech & Electronics",
  "Outdoor & Adventure",
  "Sports & Fitness",
  "Gaming",
  "Tools & DIY",
  "Kitchen & Cooking",
  "Events & Party",
  "Art & Craft",
  "Other",
];

const STOP_WORDS = new Set([
  "i", "a", "an", "the", "want", "need", "looking", "for", "some", "to",
  "and", "or", "is", "are", "can", "my", "me", "us", "we", "do", "get",
  "find", "borrow", "rent", "use", "with", "that", "this", "it",
]);

export function fallbackKeywords(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(w => !STOP_WORDS.has(w) && w.length > 1);
  return words.length > 0 ? words : [query];
}

export async function expandQueryWithAI(query: string): Promise<{ keywords: string[]; categories: string[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { keywords: fallbackKeywords(query), categories: [] };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You help users search a peer-to-peer item lending platform in Bangladesh.
Given a user query, respond with JSON only (no markdown, no code block):
{"keywords": string[], "categories": string[]}
keywords: 2-5 core item-name search terms extracted from the query
categories: subset of [${AI_CATEGORIES.join(", ")}] that best match the intent

User query: ${query}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(raw) as { keywords?: string[]; categories?: string[] };
    return {
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0 ? parsed.keywords : fallbackKeywords(query),
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
    };
  } catch {
    return { keywords: fallbackKeywords(query), categories: [] };
  }
}

export function buildItemSearchOR(keywords: string[], aiCategories: string[]) {
  return [
    ...keywords.flatMap((kw) => [
      { product: { name: { contains: kw } } },
      { product: { category: { contains: kw } } },
      { product: { description: { contains: kw } } },
    ]),
    ...(aiCategories.length > 0 ? [{ product: { category: { in: aiCategories } } }] : []),
  ];
}
