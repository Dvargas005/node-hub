import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!_genAI) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[GEMINI] API key present:", !!process.env.GEMINI_API_KEY, "length:", process.env.GEMINI_API_KEY?.length);
    }
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY no configurada");
    }
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _genAI;
}

export function getGeminiModel(opts?: { systemInstruction?: string; maxOutputTokens?: number }) {
  return getGenAI().getGenerativeModel({
    model: "gemini-2.5-flash",
    ...(opts?.systemInstruction ? { systemInstruction: opts.systemInstruction } : {}),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: opts?.maxOutputTokens || 1024,
    },
  });
}
