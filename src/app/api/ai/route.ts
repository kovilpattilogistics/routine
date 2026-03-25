import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PERSONA } from '@/ai/prompts';
import { buildHabitMatrixString, buildUserProfileContext } from '@/ai/contextBuilder';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    const { profile, habits, trigger } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Profile data is required." }, { status: 400 });
    }

    // Determine the immediate context based on the trigger
    let eventContext = "";
    if (trigger?.type === 'APP_LOAD') {
      eventContext = "EVENT: User just opened the app. Give them a strategic overview, praise consistency, or provide a gentle streak recovery if they missed recent days.";
    } else if (trigger?.type === 'TASK_TOGGLE') {
      eventContext = `EVENT: User just completed a task: "${trigger.actionPayload}". Praise this specific action or relate it to their overarching goal.`;
    }

    // Build the massive context string
    const userContextStr = buildUserProfileContext(profile);
    
    // We strictly need the last 14 days for the matrix builder
    const last14Days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split("T")[0];
    });

    const matrixStr = buildHabitMatrixString(habits || [], last14Days);

    const prompt = `
${SYSTEM_PERSONA}

---

${userContextStr}

${matrixStr}

${eventContext}

Analyze the above and provide your JSON response:
`;

    // Force JSON output
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse it safely to ensure it's valid JSON before returning
    const parsedJson = JSON.parse(text.trim());

    return NextResponse.json({ data: parsedJson });
  } catch (error: any) {
    console.error("Gemini AI Engine Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI insight" }, { status: 500 });
  }
}
