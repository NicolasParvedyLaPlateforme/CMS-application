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
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ phonetic: "" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Provide the phonetic pronunciation for the following Thai text. 
Use a transcription system that clearly distinguishes vowel length (e.g., 'a' vs 'aa') and indicates tones using standard diacritics (mid: no mark, low: à, falling: â, high: á, rising: ǎ). Also use hyphens between syllables where appropriate.
Example: ห้านาที -> hâa naa-thii.
ONLY return the phonetic string, nothing else. Do not use quotes or markdown.
Thai text: ${text}`,
    });

    return NextResponse.json({ phonetic: response.text?.trim() || "" });
  } catch (error) {
    console.error("Error generating phonetic:", error);
    return NextResponse.json(
      { error: "Failed to generate phonetic" },
      { status: 500 },
    );
  }
}
