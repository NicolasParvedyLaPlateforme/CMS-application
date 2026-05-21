import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ phonetic: "" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Provide the phonetic pronunciation (similar to RTGS or standard Thai transcription) for the following Thai text. ONLY return the phonetic string, nothing else. Do not use quotes or markdown. Thai text: ${text}`,
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
