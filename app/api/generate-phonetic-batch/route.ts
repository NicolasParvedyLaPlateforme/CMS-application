import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export async function POST(req: NextRequest) {
  try {
    const ai = getAiClient();
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Provide the phonetic pronunciation for the following Thai text items. 
Use a transcription system that clearly distinguishes vowel length (e.g., 'a' vs 'aa') and indicates tones using standard diacritics (mid: no mark, low: à, falling: â, high: á, rising: ǎ).
Important rules for spacing and hyphenation:
- Use SPACES between distinct words.
- Use HYPHENS between syllables WITHIN the same word.
Example for ห้านาที -> hâa naa-thii.

The input is a JSON array of Thai strings. 
You MUST return a JSON array of the exact same length, containing the phonetic strings in the corresponding order. Do not wrap code block \`\`\`json, just return raw JSON string.

Input:
${JSON.stringify(items)}`,
    });

    let resultText = response.text?.trim() || "[]";

    if (resultText.startsWith("\`\`\`json")) {
      resultText = resultText
        .replace(/^\`\`\`json\n/, "")
        .replace(/\n\`\`\`$/, "");
    } else if (resultText.startsWith("\`\`\`")) {
      resultText = resultText.replace(/^\`\`\`\n/, "").replace(/\n\`\`\`$/, "");
    }

    let parsedResults = [];
    try {
      parsedResults = JSON.parse(resultText);
    } catch (e) {
      throw new Error("Failed to parse Gemini response as JSON: " + resultText);
    }

    return NextResponse.json({ results: parsedResults });
  } catch (error: any) {
    console.error("Error batch generating phonetic:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to batch generate phonetic" },
      { status: 500 },
    );
  }
}
