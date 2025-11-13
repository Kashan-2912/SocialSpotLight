// server/ai-routes.ts
import { Router, type Request, type Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tryGenerateWithRetries(modelName: string, prompt: string, maxRetries = 4) {
  // exponential backoff base (ms)
  const baseDelay = 500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text() ?? ""; // keep defensive
      return { success: true, text: String(text).trim() };
    } catch (err: any) {
      // If last attempt, return error
      if (attempt === maxRetries) {
        return { success: false, error: err };
      }

      // Inspect status codes if available
      const status = err?.status || err?.statusCode || err?.response?.status;
      // retry on overloaded / rate-limited or transient network errors
      if (status === 503 || status === 429 || (err && String(err).match(/timeout|ECONNRESET|ETIMEDOUT/i))) {
        // jittered exponential backoff
        const jitter = Math.floor(Math.random() * 300);
        const delay = baseDelay * 2 ** attempt + jitter;
        console.warn(`[AI] transient error from ${modelName} (status=${status}) attempt ${attempt + 1}/${maxRetries}. retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      } else {
        // non-retryable error
        return { success: false, error: err };
      }
    }
  }
  return { success: false, error: new Error("Unreachable") };
}

async function discoverModelsFallback() {
  // A small fallback list ordered by preference.
  // Update these names if your project has access to other models.
  return [
    "models/gemini-2.5-pro",
    "models/gemini-2.5-flash",
    "models/gemini-2.1",
    "models/gemini-1.5-pro",
    "models/chat-bison-001" // Vertex fallback
  ];
}

async function getCandidateModels() {
  // Try to get list from SDK if available; otherwise use fallback
  try {
    const maybeListFn = (genAI as any).listModels || (genAI as any).getModels;
    if (typeof maybeListFn === "function") {
      const body = await maybeListFn.call(genAI);
      // body.models may vary shape; be defensive
      const modelNames: string[] = (body?.models || []).map((m: any) => m.name).filter(Boolean);
      if (modelNames.length > 0) return modelNames;
    }
  } catch (err) {
    console.warn("[AI] listModels unavailable or failed:", err instanceof Error ? err.message : err);
  }
  return await discoverModelsFallback();
}

// Generate AI bio
router.post("/generate-bio", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const prompt = `Generate a creative, professional, and engaging bio for a social media profile for someone named "${name}".
    The bio should be:
    - 1-2 sentences long (under 150 characters)
    - Professional yet friendly
    - Include relevant emojis
    - Focused on connection and growth
    - Not include hashtags

    Generate ONLY the bio text, nothing else.`;

    // Get candidate models (SDK listModels if available, else fallback list)
    const candidates = await getCandidateModels();

    // Attempt each model until one returns success
    for (const candidate of candidates) {
      console.info(`[AI] trying model: ${candidate}`);
      const attempt = await tryGenerateWithRetries(candidate, prompt, 4);
      if (attempt.success) {
        // success: return bio
        return res.json({ bio: attempt.text });
      } else {
        // log and try next candidate
        console.warn(`[AI] model ${candidate} failed:`, attempt.error?.message ?? attempt.error);
      }
    }

    // If we reach here, all candidates failed
    console.error("[AI] all candidate models failed to generate a bio");
    return res.status(503).json({ error: "AI service unavailable. Please try again later." });
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    res.status(500).json({ error: "Failed to generate bio", details: error?.message ?? String(error) });
  }
});

export default router;
