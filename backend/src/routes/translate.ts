import { Router } from "express";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { translationCache } from "../db/schema.js";

const router = Router();

const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.8-flash"];

const DEEPL_LANG_MAP: Record<string, string> = {
  en: "EN-US",
  es: "ES",
  fr: "FR",
  de: "DE",
  zh: "ZH-HANS",
  ar: "AR",
};

function isDeepLFreeKey(key: string) {
  return key.endsWith(":fx");
}

async function translateWithDeepL(text: string, targetLang: string): Promise<string | null> {
  const apiKey = process.env.DEEPL_API_KEY;
  const deeplCode = DEEPL_LANG_MAP[targetLang];
  if (!apiKey || !deeplCode) return null;

  const base = isDeepLFreeKey(apiKey) ? "https://api-free.deepl.com" : "https://api.deepl.com";

  try {
    const resp = await fetch(`${base}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: [text], target_lang: deeplCode }),
    });

    if (!resp.ok) {
      console.error("DeepL API error:", await resp.text());
      return null;
    }

    const data = await resp.json();
    return data?.translations?.[0]?.text ?? null;
  } catch (err) {
    console.error("DeepL request failed:", err);
    return null;
  }
}

const SARVAM_LANG_MAP: Record<string, string> = {
  hi: "hi-IN",
};

async function translateWithSarvam(text: string, targetLang: string): Promise<string | null> {
  const apiKey = process.env.SARVAM_API_KEY;
  const sarvamCode = SARVAM_LANG_MAP[targetLang];
  if (!apiKey || !sarvamCode) return null;

  try {
    const resp = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        source_language_code: "auto",
        target_language_code: sarvamCode,
      }),
    });

    if (!resp.ok) {
      console.error("Sarvam API error:", await resp.text());
      return null;
    }

    const data = await resp.json();
    return data?.translated_text ?? null;
  } catch (err) {
    console.error("Sarvam request failed:", err);
    return null;
  }
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese",
  ar: "Arabic",
};

async function translateWithGemini(text: string, targetLang: string): Promise<string | null> {
  const languageName = LANG_NAMES[targetLang] ?? targetLang;
  const prompt = `Translate the following text to ${languageName}. Respond with ONLY the translated text, no explanation:\n\n${text}`;

  for (const model of GEMINI_MODELS) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      if (!resp.ok) {
        console.error(`Gemini API error (${model}):`, await resp.text());
        continue;
      }

      const data = await resp.json();
      const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (translated) return translated;
    } catch (err) {
      console.error(`Gemini request failed (${model}):`, err);
    }
  }

  return null;
}

router.post("/translate", async (req, res) => {
  const { text, targetLang } = req.body as { text?: string; targetLang?: string };
  if (!text || !targetLang) {
    return res.status(400).json({ error: "text and targetLang required" });
  }

  const cacheKey = crypto.createHash("sha256").update(`${targetLang}::${text}`).digest("hex");

  const [cached] = await db.select().from(translationCache).where(eq(translationCache.cacheKey, cacheKey));
  if (cached) return res.json({ translatedText: cached.translatedText, cached: true });

  const deeplResult = await translateWithDeepL(text, targetLang);
  const sarvamResult = deeplResult ? null : await translateWithSarvam(text, targetLang);
  const geminiResult = deeplResult || sarvamResult ? null : await translateWithGemini(text, targetLang);

  const translatedText = deeplResult ?? sarvamResult ?? geminiResult;
  if (!translatedText) return res.status(502).json({ error: "translation service unavailable" });

  await db
    .insert(translationCache)
    .values({ cacheKey, originalText: text, targetLang, translatedText })
    .onConflictDoNothing()
    .catch((err) => console.error("translation cache write failed:", err));

  res.json({ translatedText });
});

export default router;