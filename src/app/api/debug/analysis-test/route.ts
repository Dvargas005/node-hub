import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGeminiModel } from "@/lib/gemini";

export const maxDuration = 60;

export async function GET() {
  const steps: string[] = [];
  try {
    steps.push("1. Checking GEMINI_API_KEY: " + (!!process.env.GEMINI_API_KEY));

    steps.push("2. Testing DB connection...");
    const userCount = await db.user.count();
    steps.push("2. DB OK, users: " + userCount);

    steps.push("3. Creating Gemini model...");
    const model = getGeminiModel({});
    steps.push("3. Model created: " + !!model);

    steps.push("4. Calling Gemini...");
    const result = await model.generateContent("Say hello in one word.");
    const text = result.response.text();
    steps.push("4. Gemini responded: " + text.substring(0, 50));

    return NextResponse.json({ success: true, steps });
  } catch (err: any) {
    steps.push("ERROR: " + err.message);
    return NextResponse.json({
      success: false,
      steps,
      error: err.message,
      stack: err.stack?.substring(0, 500),
    }, { status: 500 });
  }
}
