import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();
    const response = await ai.models.generateContent({
      model: model || "gemini-3.5-flash",
      contents: prompt,
    });
    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content: " + error.message },
      { status: 500 }
    );
  }
}
