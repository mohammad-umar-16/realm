const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// simple in-memory cache — same short phrases (greetings, filler) repeat often in live speech,
// no reason to re-translate identical text+lang pairs within a session
const cache = new Map<string, string>();

export async function translateText(text: string, targetLang: string): Promise<string> {
  const key = `${targetLang}:${text}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const resp = await fetch(`${BACKEND_URL}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang }),
    });
    if (!resp.ok) return text; // fail open — show original text rather than nothing

    const { translatedText } = await resp.json();
    cache.set(key, translatedText);
    return translatedText;
  } catch (err) {
    console.error("translation request failed:", err);
    return text;
  }
}
