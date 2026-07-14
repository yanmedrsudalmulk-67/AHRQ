import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();
    
    let attempts = 3;
    let lastError: any = null;
    let response = null;
    
    for (let i = 0; i < attempts; i++) {
      try {
        response = await ai.models.generateContent({
          model: model || "gemini-3.5-flash",
          contents: prompt,
        });
        if (response && response.text) {
          return NextResponse.json({ text: response.text });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini attempt ${i + 1} failed:`, err);
        
        // If it's a 503 (service unavailable) or 429 (rate limit), wait and retry
        const errStatus = err.status || (err.error?.code) || 0;
        const errMsg = err.message || "";
        
        if (
          errStatus === 503 || 
          errStatus === 429 || 
          errMsg.includes("503") || 
          errMsg.includes("429") ||
          errMsg.includes("high demand") || 
          errMsg.includes("temporary") ||
          errMsg.includes("UNAVAILABLE")
        ) {
          await delay(1200 * (i + 1)); // Linear backoff
          continue;
        }
        break; // Non-retryable error, fail fast
      }
    }
    
    throw lastError || new Error("Failed to generate content after multiple retries");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content: " + error.message },
      { status: 503 } // Return 503 indicating temporary unavailability
    );
  }
}

